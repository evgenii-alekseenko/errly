import { useEffect, useState } from 'react';
import { getErrors, watchErrors } from '@/lib/storage';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function ErrorRow({ record }: { record: ErrorRecord }) {
  return (
    <li className="error-row" data-testid="error-row">
      <span className="status">{record.statusCode}</span>
      <span className="method">{record.method}</span>
      <span className="url" title={record.url}>{record.url}</span>
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
