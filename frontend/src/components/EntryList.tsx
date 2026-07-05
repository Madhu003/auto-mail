import { Entry } from '../types/entry';
import { EntryCard } from './EntryCard';

interface Props {
  entries: Entry[];
  onUpdate: (id: string, patch: { subject?: string; body?: string }) => Promise<void>;
  onSend: (id: string) => Promise<void>;
}

export function EntryList({ entries, onUpdate, onSend }: Props) {
  if (entries.length === 0) {
    return <p className="empty-state">No posts added yet — paste one above to get started.</p>;
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onUpdate={onUpdate} onSend={onSend} />
      ))}
    </div>
  );
}
