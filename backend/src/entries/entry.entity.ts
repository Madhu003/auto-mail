export type PostCategory = 'fullstack' | 'frontend' | 'backend' | 'other';
export type GenerationStatus = 'pending' | 'success' | 'failure';
export type SendStatus = 'idle' | 'pending' | 'success' | 'failure';

export interface Entry {
  id: string;
  rawPostText: string;

  company?: string;
  role?: string;
  category?: PostCategory;
  contactEmail?: string;

  subject?: string;
  body?: string;

  generationStatus: GenerationStatus;
  generationError?: string;

  sendStatus: SendStatus;
  sendError?: string;
  sentAt?: string;

  createdAt: string;
  updatedAt: string;
}
