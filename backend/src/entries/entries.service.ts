import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Entry } from './entry.entity';
import { ENTRY_REPOSITORY, EntryRepository } from './repository/entry-repository.interface';
import { EMAIL_DRAFTING_SERVICE, EmailDraftingService } from '../email-drafting/email-drafting.interface';
import { MAIL_SENDER_SERVICE, MailSenderService } from '../mail-sender/mail-sender.interface';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

@Injectable()
export class EntriesService {
  private readonly logger = new Logger(EntriesService.name);

  constructor(
    @Inject(ENTRY_REPOSITORY) private readonly repo: EntryRepository,
    @Inject(EMAIL_DRAFTING_SERVICE) private readonly drafter: EmailDraftingService,
    @Inject(MAIL_SENDER_SERVICE) private readonly mailer: MailSenderService,
    private readonly config: ConfigService,
  ) {}

  async createEntry(rawPostText: string): Promise<Entry> {
    const entry: Entry = {
      id: uuidv4(),
      rawPostText,
      generationStatus: 'pending',
      sendStatus: 'idle',
      createdAt: now(),
      updatedAt: now(),
    };
    await this.repo.create(entry);

    // Fire-and-forget: the HTTP response returns immediately with a pending
    // entry, the frontend polls for the generation result.
    void this.runGeneration(entry.id);

    return entry;
  }

  private async runGeneration(id: string): Promise<void> {
    const entry = await this.repo.findById(id);
    if (!entry) return;

    try {
      const draft = await this.drafter.draft(entry.rawPostText);
      await this.repo.update(id, {
        ...draft,
        generationStatus: 'success',
        updatedAt: now(),
      });
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Generation failed for entry ${id}: ${err.message}`);
      await this.repo.update(id, {
        generationStatus: 'failure',
        generationError: err.message,
        updatedAt: now(),
      });
    }
  }

  async listEntries(): Promise<Entry[]> {
    return this.repo.findAll();
  }

  async getEntry(id: string): Promise<Entry> {
    const entry = await this.repo.findById(id);
    if (!entry) throw new NotFoundException(`Entry ${id} not found`);
    return entry;
  }

  async updateEntry(id: string, patch: { subject?: string; body?: string }): Promise<Entry> {
    // Only include fields the caller actually provided — the DTO instance
    // carries an explicit `undefined` for any field the client omitted, and
    // spreading that into the repository's merge would overwrite the
    // existing value instead of leaving it untouched.
    const cleanPatch: Partial<Entry> = { updatedAt: now() };
    if (patch.subject !== undefined) cleanPatch.subject = patch.subject;
    if (patch.body !== undefined) cleanPatch.body = patch.body;

    const updated = await this.repo.update(id, cleanPatch);
    if (!updated) throw new NotFoundException(`Entry ${id} not found`);
    return updated;
  }

  // Marks the entry as send-pending and returns immediately; the actual send
  // happens fire-and-forget, symmetric with generation, so the frontend can
  // poll both the same way.
  async sendOne(id: string): Promise<Entry> {
    const entry = await this.getEntry(id);
    const pending = await this.repo.update(id, { sendStatus: 'pending', sendError: undefined, updatedAt: now() });
    void this.performSend(entry.id);
    return pending!;
  }

  // Does the actual send + status update, awaited fully. Used directly (not
  // via sendOne's fire-and-forget wrapper) by sendAll, so the delay between
  // sends is a delay between completed sends, not just between dispatches.
  private async performSend(id: string): Promise<void> {
    const entry = await this.repo.findById(id);
    if (!entry || !entry.contactEmail || !entry.subject || !entry.body) {
      await this.repo.update(id, {
        sendStatus: 'failure',
        sendError: 'Entry is missing a contact email, subject, or body — generation may have failed.',
        updatedAt: now(),
      });
      return;
    }

    const result = await this.mailer.send(entry.contactEmail, entry.subject, entry.body);
    await this.repo.update(id, {
      sendStatus: result.success ? 'success' : 'failure',
      sendError: result.error,
      sentAt: result.success ? now() : undefined,
      updatedAt: now(),
    });
  }

  // Sends all entries that finished generating successfully and haven't
  // already sent successfully, sequentially, with a delay between each —
  // same rate-limiting behavior the old CLI pipeline used.
  async sendAll(): Promise<number> {
    const entries = await this.repo.findAll();
    const eligible = entries.filter((e) => e.generationStatus === 'success' && e.sendStatus !== 'success');

    void (async () => {
      const delayMs = this.config.get<number>('email.delayMs')!;
      for (let i = 0; i < eligible.length; i++) {
        await this.repo.update(eligible[i].id, { sendStatus: 'pending', sendError: undefined, updatedAt: now() });
        await this.performSend(eligible[i].id);
        if (i < eligible.length - 1) await sleep(delayMs);
      }
    })();

    return eligible.length;
  }
}
