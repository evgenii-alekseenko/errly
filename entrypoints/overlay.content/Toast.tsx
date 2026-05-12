import { useEffect, useState } from 'react';
import {
  type CodeColors,
  DEFAULT_SETTINGS,
  type NotificationPosition,
  getSettings,
  watchSettings,
} from '@/lib/settings';
import type { ErrorRecord } from '@/lib/types';
import { subscribe } from '@/lib/toast-store';
import { getRecordColor, networkLabel } from '@/lib/format';

function ToastCard({ record, color }: { record: ErrorRecord; color: string }) {
  const style = { borderLeftColor: color };
  if (record.kind === 'network') {
    return (
      <div className="toast network" style={style} data-testid="toast" data-kind="network">
        <span className="label" title={record.errorText}>{networkLabel(record)}</span>
        <div className="body">
          <div className="title">{record.method} {record.url}</div>
          <div className="time">{new Date(record.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="toast runtime" style={style} data-testid="toast" data-kind="runtime">
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
  const [position, setPosition] = useState<NotificationPosition>(
    DEFAULT_SETTINGS.notificationPosition,
  );
  const [codeColors, setCodeColors] = useState<CodeColors>({});

  useEffect(() => subscribe(setToasts), []);
  useEffect(() => {
    getSettings().then((s) => {
      setPosition(s.notificationPosition);
      setCodeColors(s.codeColors);
    });
    return watchSettings((s) => {
      setPosition(s.notificationPosition);
      setCodeColors(s.codeColors);
    });
  }, []);

  return (
    <div
      className={`toast-stack ${position}`}
      data-testid="toast-stack"
      data-position={position}
    >
      {toasts.map((record) => (
        <ToastCard key={record.id} record={record} color={getRecordColor(record, codeColors)} />
      ))}
    </div>
  );
}
