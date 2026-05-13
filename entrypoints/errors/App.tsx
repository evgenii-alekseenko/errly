import { useEffect, useState } from 'react';
import { clearErrors, getErrors, watchErrors } from '@/lib/storage';
import { DEFAULT_SETTINGS, getSettings, watchSettings, type Settings } from '@/lib/settings';
import { matchesType, shouldShowRecord, type TypeFilter } from '@/lib/filter';
import { matchesSearch } from '@/lib/search';
import { ThemeApplier } from '@/lib/use-settings';
import { getRecordColor, networkLabel } from '@/lib/format';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'network', label: 'Network' },
  { value: 'runtime', label: 'Runtime' },
];

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
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    getErrors().then(setErrors);
    return watchErrors(setErrors);
  }, []);

  useEffect(() => {
    getSettings().then(setLocalSettings);
    return watchSettings(setLocalSettings);
  }, []);

  const visible = errors.filter(
    (e) =>
      shouldShowRecord(e, settings.codeFilters) &&
      matchesType(e, typeFilter) &&
      matchesSearch(e, query),
  );
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
      <div className="toolbar">
        <input
          type="search"
          className="search"
          placeholder="Search url, message, code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="search-input"
        />
        <div className="type-filter" role="group" aria-label="Type filter">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={typeFilter === opt.value ? 'active' : ''}
              aria-pressed={typeFilter === opt.value}
              onClick={() => setTypeFilter(opt.value)}
              data-testid={`type-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
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
