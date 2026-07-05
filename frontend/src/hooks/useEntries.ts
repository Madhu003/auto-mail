import { useCallback, useEffect, useState } from 'react';
import { entriesApi } from '../api/entries';
import { Entry } from '../types/entry';
import { usePolling } from './usePolling';
import { splitPosts } from '../utils/splitPosts';

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

  // A pasted blob may contain multiple posts separated by a dashed delimiter
  // (---, ------, etc) — one entry gets created per post found. Uses
  // allSettled so one bad post in a batch doesn't lose the rest.
  const addEntry = useCallback(async (rawPostText: string) => {
    const posts = splitPosts(rawPostText);
    const results = await Promise.allSettled(posts.map((post) => entriesApi.create(post)));

    const created = results
      .filter((r): r is PromiseFulfilledResult<Entry> => r.status === 'fulfilled')
      .map((r) => r.value);
    setEntries((prev) => [...created, ...prev]);

    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(
        `${created.length} of ${posts.length} post(s) added — ${failures.length} failed: ${failures[0].reason?.message ?? 'unknown error'}`,
      );
    }
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
