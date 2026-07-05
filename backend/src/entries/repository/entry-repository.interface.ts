import { Entry } from '../entry.entity';

export const ENTRY_REPOSITORY = Symbol('ENTRY_REPOSITORY');

// Abstraction the rest of the app depends on (Dependency Inversion) — swap
// InMemoryEntryRepository for a database-backed implementation later without
// touching EntriesService or anything above this interface.
export interface EntryRepository {
  create(entry: Entry): Promise<Entry>;
  findAll(): Promise<Entry[]>;
  findById(id: string): Promise<Entry | undefined>;
  update(id: string, patch: Partial<Entry>): Promise<Entry | undefined>;
}
