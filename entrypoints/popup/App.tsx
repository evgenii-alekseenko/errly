import { useEffect, useState } from 'react';
import { getErrors, watchErrors } from '@/lib/storage';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function ErrorRow({ record }: { record: ErrorRecord }) {
  if (record.kind === 'network') {
    return (
      <li className="error-row network" data-testid="error-row" data-kind="network">
        <span className="label">{record.statusCode}</span>
        <span className="meta">{record.method}</span>
        <span className="detail" title={record.url}>{record.url}</span>
        <span className="time">{formatTime(record.timestamp)}</span>
      </li>
    );
  }
  return (
    <li className="error-row runtime" data-testid="error-row" data-kind="runtime">
      <span className="label">ERR</span>
      <span className="meta" title={record.source}>{record.source}</span>
      <span className="detail" title={record.message}>{record.message}</span>
      <span className="time">{formatTime(record.timestamp)}</span>
    </li>
  );
}

function App() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);

  useEffect(() => {
    getErrors().then(setErrors);
    return watchErrors(setErrors);
  }, []);

  return (
    <div className="popup">
      <h1>Error Logger</h1>
      {errors.length === 0 ? (
        <p className="empty" data-testid="empty">No errors yet</p>
      ) : (
        <ul className="error-list">
          {[...errors].reverse().map((e) => (
            <ErrorRow key={e.id} record={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
