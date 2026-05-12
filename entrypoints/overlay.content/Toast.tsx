import { useEffect, useState } from 'react';
import type { ErrorRecord } from '@/lib/types';
import { subscribe } from '@/lib/toast-store';

function ToastCard({ record }: { record: ErrorRecord }) {
  if (record.kind === 'network') {
    return (
      <div className="toast network" data-testid="toast" data-kind="network">
        <span className="label">{record.statusCode}</span>
        <div className="body">
          <div className="title">{record.method} {record.url}</div>
          <div className="time">{new Date(record.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="toast runtime" data-testid="toast" data-kind="runtime">
      <span className="label">ERR</span>
      <div className="body">
        <div className="title">{record.message}</div>
        <div className="time">{record.source}</div>
      </div>
    </div>
  );
}

export function ToastQueue() {
  const [toasts, setToasts] = useState<ErrorRecord[]>([]);

  useEffect(() => subscribe(setToasts), []);

  return (
    <div className="toast-stack" data-testid="toast-stack">
      {toasts.map((record) => (
        <ToastCard key={record.id} record={record} />
      ))}
    </div>
  );
}
