import { PostCategory } from '../entries/entry.entity';

export const EMAIL_DRAFTING_SERVICE = Symbol('EMAIL_DRAFTING_SERVICE');

export interface DraftResult {
  company?: string;
  role?: string;
  category: PostCategory;
  contactEmail: string;
  subject: string;
  body: string;
}

// Abstraction EntriesService depends on — swap the Ollama implementation for
// a different LLM provider later without touching EntriesService.
export interface EmailDraftingService {
  draft(rawPostText: string): Promise<DraftResult>;
}
