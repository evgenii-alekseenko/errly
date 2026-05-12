import { useEffect, useState } from 'react';
import { clearErrors, getErrors, watchErrors } from '@/lib/storage';
import { DEFAULT_SETTINGS, getSettings, watchSettings, type Settings } from '@/lib/settings';
import { shouldShowRecord } from '@/lib/filter';
import { ThemeApplier } from '@/lib/use-settings';
import { getRecordColor, networkLabel } from '@/lib/format';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function ErrorCard({ record, color }: { record: ErrorRecord; color: string }) {
  const style = { borderLeftColor: color, borderLeftWidth: '4px', borderLeftStyle: 'solid' as const };
  if (record.kind === 'network') {
    return (
      <article className="card network" style={style} data-testid="error-card" data-kind="network">
        <header>
          <span className="badge status" title={record.errorText}>{networkLabel(record)}</span>
          <span className="badge method">{record.method}</span>
          <span className="time">{formatTimestamp(record.timestamp)}</span>
        </header>
        <p className="url" title={record.url}>{record.url}</p>
      </article>
    );
  }
  return (
    <article className="card runtime" style={style} data-testid="error-card" data-kind="runtime">
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
  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getErrors().then(setErrors);
    return watchErrors(setErrors);
  }, []);

  useEffect(() => {
    getSettings().then(setLocalSettings);
    return watchSettings(setLocalSettings);
  }, []);

  const visible = errors.filter((e) => shouldShowRecord(e, settings.codeFilters));
  const hidden = errors.length - visible.length;

  return (
    <div className="history">
      <ThemeApplier />
      <header className="page-header">
        <h1>Error History</h1>
        <div className="actions">
          <span className="count">
            {visible.length} / {errors.length}
            {hidden > 0 && <span className="hidden-note" data-testid="hidden-note"> ({hidden} hidden)</span>}
          </span>
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
      ) : visible.length === 0 ? (
        <p className="empty" data-testid="all-filtered">All errors filtered out.</p>
      ) : (
        <ul className="card-list">
          {[...visible].reverse().map((e) => (
            <li key={e.id}>
              <ErrorCard record={e} color={getRecordColor(e, settings.codeColors)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
