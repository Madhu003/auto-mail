import { useEffect, useState } from 'react';
import { Entry } from '../types/entry';
import { StatusBadge } from './StatusBadge';

interface Props {
  entry: Entry;
  onUpdate: (id: string, patch: { subject?: string; body?: string }) => Promise<void>;
  onSend: (id: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function entryTitle(entry: Entry): string {
  if (entry.subject) return entry.subject;
  if (entry.generationStatus === 'pending') return '⏳ Generating…';
  if (entry.generationStatus === 'failure') return '❌ Generation failed';
  const snippet = entry.rawPostText.slice(0, 70);
  return snippet.length < entry.rawPostText.length ? `${snippet}…` : snippet;
}

export function EntryCard({ entry, onUpdate, onSend, onRegenerate, onDelete }: Props) {
  const [open, setOpen] = useState(true);
  const [subject, setSubject] = useState(entry.subject ?? '');
  const [body, setBody] = useState(entry.body ?? '');
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate(entry.id);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setDeleting(false);
    }
  };

  const canSend = entry.generationStatus === 'success' && entry.sendStatus !== 'success' && entry.sendStatus !== 'pending';
  const canRegenerate = entry.generationStatus !== 'pending' && !regenerating;

  return (
    <div className="entry-card">
      <div className="entry-card__header" onClick={() => setOpen((o) => !o)}>
        <span className="entry-card__toggle">{open ? '▾' : '▸'}</span>
        <span className="entry-card__title">{entryTitle(entry)}</span>
        <StatusBadge status={entry.generationStatus} error={entry.generationError} />
        {entry.generationStatus === 'success' && <StatusBadge status={entry.sendStatus} error={entry.sendError} />}
        <button
          className="button--danger button--small"
          onClick={(e) => {
            e.stopPropagation();
            void handleDelete();
          }}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : '🗑 Delete'}
        </button>
      </div>

      {open && (
        <div className="entry-card__body">
          <details className="entry-card__raw">
            <summary>Raw post text</summary>
            <p>{entry.rawPostText}</p>
          </details>

          <div className="entry-card__row">
            {entry.company && <span className="tag">🏢 {entry.company}</span>}
            {entry.role && <span className="tag">💼 {entry.role}</span>}
            {entry.contactEmail && <span className="tag">✉️ {entry.contactEmail}</span>}
          </div>

          {entry.generationStatus === 'failure' && (
            <details className="error-log">
              <summary>Show generation error</summary>
              <pre>{entry.generationError}</pre>
            </details>
          )}

          {entry.sendStatus === 'failure' && (
            <details className="error-log">
              <summary>Show send error</summary>
              <pre>{entry.sendError}</pre>
            </details>
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
                <button className="button--secondary" onClick={handleRegenerate} disabled={!canRegenerate}>
                  {regenerating ? 'Regenerating…' : '🔄 Regenerate'}
                </button>
              </div>
            </div>
          )}

          {entry.generationStatus === 'failure' && (
            <button className="button--secondary" onClick={handleRegenerate} disabled={!canRegenerate}>
              {regenerating ? 'Regenerating…' : '🔄 Regenerate'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
