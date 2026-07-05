import { useEntries } from './hooks/useEntries';
import { PostInputForm } from './components/PostInputForm';
import { EntryList } from './components/EntryList';

export function App() {
  const {
    entries,
    loaded,
    addEntry,
    updateEntry,
    sendOne,
    sendAll,
    regenerateEntry,
    deleteEntry,
    deleteAllEntries,
  } = useEntries();

  const sendableCount = entries.filter(
    (e) => e.generationStatus === 'success' && e.sendStatus !== 'success' && e.sendStatus !== 'pending',
  ).length;

  const handleDeleteAll = () => {
    if (entries.length === 0) return;
    if (window.confirm(`Delete all ${entries.length} entries? This can't be undone.`)) {
      void deleteAllEntries();
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Auto-Mail</h1>
        <p>Paste a LinkedIn hiring post below to draft a personalized cold email.</p>
      </header>

      <PostInputForm onAdd={addEntry} />

      <div className="app__toolbar">
        <h2>Entries</h2>
        <div className="app__toolbar-actions">
          <button className="button--secondary" onClick={handleDeleteAll} disabled={entries.length === 0}>
            Delete All
          </button>
          <button onClick={() => void sendAll()} disabled={sendableCount === 0}>
            Send All ({sendableCount})
          </button>
        </div>
      </div>

      {loaded && (
        <EntryList
          entries={entries}
          onUpdate={updateEntry}
          onSend={sendOne}
          onRegenerate={regenerateEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  );
}
