import { apiClient } from './client';
import { Entry } from '../types/entry';

export const entriesApi = {
  create: (rawPostText: string) => apiClient.post<Entry>('/entries', { rawPostText }),
  list: () => apiClient.get<Entry[]>('/entries'),
  get: (id: string) => apiClient.get<Entry>(`/entries/${id}`),
  update: (id: string, patch: { subject?: string; body?: string }) =>
    apiClient.patch<Entry>(`/entries/${id}`, patch),
  send: (id: string) => apiClient.post<Entry>(`/entries/${id}/send`),
  sendAll: () => apiClient.post<{ triggered: number }>('/entries/send-all'),
};
