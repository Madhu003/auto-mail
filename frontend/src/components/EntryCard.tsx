import { useEffect, useState } from 'react';
import { Entry } from '../types/entry';
import { StatusBadge } from './StatusBadge';

interface Props {
  entry: Entry;
  onUpdate: (id: string, patch: { subject?: string; body?: string }) => Promise<void>;
  onSend: (id: string) => Promise<void>;
}

export function EntryCard({ entry, onUpdate, onSend }: Props) {
  const [subject, setSubject] = useState(entry.subject ?? '');
  const [body, setBody] = useState(entry.body ?? '');
  const [sending, setSending] = useState(false);

  // Keep local edit state in sync when a fresh generation result comes in via polling.
  useEffect(() => {
    setSubject(entry.subject ?? '');
    setBody(entry.body ?? '');
  }, [entry.subject, entry.body]);

  const saveIfChanged = () => {
    if (subject !== (entry.subject ?? '') || body !== (entry.body ?? '')) {
      void onUpdate(entry.id, { subject, body });
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(entry.id);
    } finally {
      setSending(false);
    }
  };

  const canSend = entry.generationStatus === 'success' && entry.sendStatus !== 'success' && entry.sendStatus !== 'pending';

  return (
    <div className="entry-card">
      <details className="entry-card__raw">
        <summary>Raw post text</summary>
        <p>{entry.rawPostText}</p>
      </details>

      <div className="entry-card__row">
        <strong>Generation:</strong>
        <StatusBadge status={entry.generationStatus} error={entry.generationError} />
        {entry.company && <span className="tag">🏢 {entry.company}</span>}
        {entry.role && <span className="tag">💼 {entry.role}</span>}
        {entry.contactEmail && <span className="tag">✉️ {entry.contactEmail}</span>}
      </div>

      {entry.generationStatus === 'failure' && (
        <p className="error-text">{entry.generationError}</p>
      )}

      {entry.generationStatus === 'success' && (
        <div className="entry-card__draft">
          <label>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={saveIfChanged} />
          </label>
          <label>
            Body
            <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} onBlur={saveIfChanged} />
          </label>

          <div className="entry-card__row">
            <button onClick={handleSend} disabled={!canSend || sending}>
              {entry.sendStatus === 'pending' ? 'Sending…' : 'Send'}
            </button>
            <StatusBadge status={entry.sendStatus} error={entry.sendError} />
          </div>
        </div>
      )}
    </div>
  );
}
