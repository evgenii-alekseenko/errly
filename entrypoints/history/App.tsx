import { useEffect, useState } from 'react';
import { clearErrors, getErrors, watchErrors } from '@/lib/storage';
import { ThemeApplier } from '@/lib/use-settings';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function ErrorCard({ record }: { record: ErrorRecord }) {
  if (record.kind === 'network') {
    return (
      <article className="card network" data-testid="error-card" data-kind="network">
        <header>
          <span className="badge status">{record.statusCode}</span>
          <span className="badge method">{record.method}</span>
          <span className="time">{formatTimestamp(record.timestamp)}</span>
        </header>
        <p className="url" title={record.url}>{record.url}</p>
      </article>
    );
  }
  return (
    <article className="card runtime" data-testid="error-card" data-kind="runtime">
      <header>
        <span className="badge status">ERR</span>
        <span className="badge source">{record.source}</span>
        <span className="time">{formatTimestamp(record.timestamp)}</span>
      </header>
      <p className="message">{record.message}</p>
      {record.stack && (
        <details className="stack">
          <summary>Stack trace</summary>
          <pre>{record.stack}</pre>
        </details>
      )}
    </article>
  );
}

function App() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);

  useEffect(() => {
    getErrors().then(setErrors);
    return watchErrors(setErrors);
  }, []);

  return (
    <div className="history">
      <ThemeApplier />
      <header className="page-header">
        <h1>Error History</h1>
        <div className="actions">
          <span className="count">{errors.length} / 20</span>
          <button
            type="button"
            onClick={clearErrors}
            data-testid="clear-button"
            disabled={errors.length === 0}
          >
            Clear history
          </button>
        </div>
      </header>
      {errors.length === 0 ? (
        <p className="empty" data-testid="empty">No errors recorded yet.</p>
      ) : (
        <ul className="card-list">
          {[...errors].reverse().map((e) => (
            <li key={e.id}>
              <ErrorCard record={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
