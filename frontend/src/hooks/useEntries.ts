import { useCallback, useEffect, useState } from 'react';
import { entriesApi } from '../api/entries';
import { Entry } from '../types/entry';
import { usePolling } from './usePolling';

const POLL_INTERVAL_MS = 1500;

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const latest = await entriesApi.list();
    setEntries(latest);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasPending = entries.some(
    (e) => e.generationStatus === 'pending' || e.sendStatus === 'pending',
  );

  // Auto-stops when nothing is in flight, resumes once something is.
  usePolling(refresh, hasPending ? POLL_INTERVAL_MS : null);

  const addEntry = useCallback(async (rawPostText: string) => {
    const created = await entriesApi.create(rawPostText);
    setEntries((prev) => [created, ...prev]);
  }, []);

  const updateEntry = useCallback(async (id: string, patch: { subject?: string; body?: string }) => {
    const updated = await entriesApi.update(id, patch);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const sendOne = useCallback(async (id: string) => {
    const updated = await entriesApi.send(id);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const sendAll = useCallback(async () => {
    await entriesApi.sendAll();
    await refresh();
  }, [refresh]);

  return { entries, loaded, addEntry, updateEntry, sendOne, sendAll };
}
