import { useEffect, useState } from 'react';
import {
  type CodeColors,
  DEFAULT_SETTINGS,
  type NotificationPosition,
  getSettings,
  watchSettings,
} from '@/lib/settings';
import type {
  CaptureScreenshotMessage,
  ErrorRecord,
  OpenDetailMessage,
} from '@/lib/types';
import { subscribe } from '@/lib/toast-store';
import { getRecordColor, networkLabel } from '@/lib/format';
import { copyDataUrlToClipboard } from '@/lib/screenshot';

function openDetail(id: string) {
  const msg: OpenDetailMessage = { type: 'open-detail', id };
  void browser.runtime.sendMessage(msg).catch(() => {});
}

async function requestScreenshot(): Promise<void> {
  const msg: CaptureScreenshotMessage = { type: 'capture-screenshot' };
  const dataUrl = (await browser.runtime.sendMessage(msg)) as string | undefined;
  if (typeof dataUrl !== 'string') return;
  await copyDataUrlToClipboard(dataUrl);
}

function ToastActionButton({
  label,
  testid,
  onClick,
  children,
}: {
  label: string;
  testid: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="toast-action"
      aria-label={label}
      title={label}
      data-testid={testid}
      onClick={onClick}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </button>
  );
}

function ToastCard({ record, color }: { record: ErrorRecord; color: string }) {
  const [copied, setCopied] = useState(false);
  const [shot, setShot] = useState(false);
  const style = { borderLeftColor: color };

  const onCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetail(record.id);
  };
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(record.id);
    }
  };

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be denied; no-op.
    }
  };

  const onShot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await requestScreenshot();
      setShot(true);
      setTimeout(() => setShot(false), 1200);
    } catch {
      // Clipboard write may fail (no permission, no transient activation).
    }
  };

  const actions = (
    <div className="toast-actions" onClick={(e) => e.stopPropagation()}>
      <ToastActionButton label={copied ? 'Copied' : 'Copy JSON'} testid="toast-copy" onClick={onCopy}>
        {copied ? '✓' : '⎘'}
      </ToastActionButton>
      <ToastActionButton
        label={shot ? 'Screenshot copied' : 'Copy screenshot'}
        testid="toast-shot"
        onClick={onShot}
      >
        {shot ? '✓' : '⌖'}
      </ToastActionButton>
    </div>
  );

  const common = {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onCardClick,
    onKeyDown: onCardKeyDown,
    'data-testid': 'toast',
  };

  if (record.kind === 'network') {
    return (
      <div className="toast network" style={style} data-kind="network" {...common}>
        <span className="label" title={record.errorText}>{networkLabel(record)}</span>
        <div className="body">
          <div className="title">{record.method} {record.url}</div>
          <div className="time">{new Date(record.timestamp).toLocaleTimeString()}</div>
        </div>
        {actions}
      </div>
    );
  }
  return (
    <div className="toast runtime" style={style} data-kind="runtime" {...common}>
      <span className="label">ERR</span>
      <div className="body">
        <div className="title">{record.message}</div>
        <div className="time">{record.source}</div>
      </div>
      {actions}
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
