import { useState } from 'react';

interface Props {
  onAdd: (rawPostText: string) => Promise<void>;
}

export function PostInputForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(text.trim());
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="post-input-form" onSubmit={handleSubmit}>
      <textarea
        placeholder="Paste one LinkedIn hiring post here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      />
      <div className="post-input-form__actions">
        <button type="submit" disabled={submitting || !text.trim()}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
        {error && <span className="error-text">{error}</span>}
      </div>
    </form>
  );
}
