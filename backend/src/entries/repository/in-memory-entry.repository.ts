import { Injectable } from '@nestjs/common';
import { Entry } from '../entry.entity';
import { EntryRepository } from './entry-repository.interface';

@Injectable()
export class InMemoryEntryRepository implements EntryRepository {
  private readonly entries = new Map<string, Entry>();

  async create(entry: Entry): Promise<Entry> {
    this.entries.set(entry.id, entry);
    return entry;
  }

  async findAll(): Promise<Entry[]> {
    // Newest first, matching how entries appear as they're pasted in.
    return [...this.entries.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findById(id: string): Promise<Entry | undefined> {
    return this.entries.get(id);
  }

  async update(id: string, patch: Partial<Entry>): Promise<Entry | undefined> {
    const existing = this.entries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.entries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async deleteAll(): Promise<void> {
    this.entries.clear();
  }
}
