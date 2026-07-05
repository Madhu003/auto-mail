import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { z } from 'zod';
import { fixMissingWhitespace } from '../common/utils/text-fixup';
import { stripHtml } from '../common/utils/strip-html';
import { stripTrailingSignOff } from '../common/utils/strip-sign-off';
import { EmailDraftingService, DraftResult } from './email-drafting.interface';
import { buildCandidateProfile, CANDIDATE_SIGNATURE } from './candidate-profile';

const DraftSchema = z.object({
  company: z.string().optional().describe('Hiring company name, if mentioned in the post'),
  role: z.string().optional().describe('Role/job title being hired for, if mentioned in the post'),
  category: z.enum(['fullstack', 'frontend', 'backend', 'other']),
  contactEmail: z
    .string()
    .describe('The email address mentioned in the post for sending a resume/CV or cold email'),
  subject: z
    .string()
    .describe(
      'A short, specific cold-email subject line, with 1-2 relevant emojis. PLAIN TEXT ONLY — never use **bold** or any other markdown/asterisks in the subject, it is an email header, not part of the body.',
    ),
  body: z
    .string()
    .describe(
      'The full email body (greeting through closing line only, no signature/sign-off — that is appended separately). Personalized to the job post, mentioning the CV is attached. Use several relevant emojis throughout, and wrap the most important details (role title, key matching skills, availability) in **bold** markdown. Structured as 3-4 short paragraphs (greeting, why you\'re reaching out, matching experience, closing), separated by a blank line (two newline characters) between each paragraph — never run two sentences or paragraphs together with no space or newline between them.',
    ),
});

const SYSTEM_PROMPT =
  'You read a single LinkedIn hiring post (which may include LinkedIn UI clutter — "· 2nd", like/comment counts, etc) and do two things: (1) extract the hiring company, role title, a category of fullstack/frontend/backend/other, and the contact email address mentioned in the post for sending a resume/CV or cold email; (2) write a concise, personalized, upbeat cold email from the job candidate to that contact, referencing specifics from the post. Mention that a resume/CV is attached. Keep the email under 200 words, professional but warm tone. Use several relevant emojis throughout (not excessive/spammy, but noticeably present) and **bold** the most important details — the role title, the key skills that match, and availability/notice period. Do NOT include a signature, sign-off name, or closing salutation ("Best regards", "Sincerely", etc.) at the end of the body — the signature is appended separately. The body must be PLAIN TEXT ONLY — never wrap it in HTML tags like <div> or <br>, never use markdown other than **bold**. If no email address is mentioned anywhere in the post, you must still return your best guess for the other fields, but leave contactEmail empty.';

@Injectable()
export class OllamaEmailDraftingService implements EmailDraftingService {
  private model?: ChatOllama;

  constructor(private readonly config: ConfigService) {}

  private getModel(): ChatOllama {
    if (!this.model) {
      this.model = new ChatOllama({
        model: this.config.get<string>('ollama.model'),
        baseUrl: this.config.get<string>('ollama.baseUrl'),
        // 4096 gives headroom for the full candidate profile + post text +
        // ~200-word output combined in one call (2048 was cutting it close,
        // occasionally truncating to a near-empty body). Still lowVram/short
        // keepAlive to bound RAM usage between requests.
        numCtx: 4096,
        lowVram: true,
        keepAlive: '2m',
      });
    }
    return this.model;
  }

  async draft(rawPostText: string): Promise<DraftResult> {
    const structuredModel = this.getModel().withStructuredOutput(DraftSchema, {
      name: 'post_email_draft',
    });

    const candidateProfile = buildCandidateProfile(
      this.config.get<string>('candidate.name')!,
      this.config.get<string>('candidate.email')!,
      this.config.get<string>('candidate.phone')!,
    );

    const result = await structuredModel.invoke([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Candidate profile:\n${candidateProfile}\n\nLinkedIn hiring post:\n${rawPostText}`,
      },
    ]);

    if (!result.contactEmail) {
      throw new Error('No contact email found in the post — cannot draft a cold email without a recipient.');
    }

    // Small local models occasionally return a near-empty body despite the
    // schema requiring meaningful content — treat that as a failed
    // generation rather than silently succeeding with nothing useful.
    const MIN_BODY_LENGTH = 40;
    if (!result.body || result.body.trim().length < MIN_BODY_LENGTH) {
      throw new Error('Model produced an empty or too-short email body — try regenerating.');
    }

    // Strip any markdown the model applies out of habit (subject is a plain
    // email header, not the body) — asterisks would otherwise show up
    // literally in the recipient's inbox.
    const cleanedSubject = result.subject?.replace(/\*\*/g, '').trim();

    // Small local models occasionally return an empty subject despite the
    // schema requiring a string — fall back to a sensible default rather
    // than sending a blank subject line.
    const subject = cleanedSubject
      ? cleanedSubject
      : `${result.role ? `${result.role} Application` : 'Job Application'} — ${this.config.get<string>('candidate.name')}`;

    return {
      company: result.company,
      role: result.role,
      category: result.category,
      contactEmail: result.contactEmail,
      subject,
      // Fixes applied only to the LLM-generated body — never to CANDIDATE_SIGNATURE,
      // which contains URLs/the candidate's name that these fixups would otherwise mangle.
      body: `${stripTrailingSignOff(
        fixMissingWhitespace(stripHtml(result.body.trim())),
        this.config.get<string>('candidate.name')!,
      )}\n\n${CANDIDATE_SIGNATURE}`,
    };
  }
}
