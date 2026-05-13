import { useState } from 'react';
import { buildCurl } from '@/lib/curl';
import { getRecordColor, networkLabel } from '@/lib/format';
import { navigateToId } from '@/lib/use-hash';
import type { CodeColors } from '@/lib/settings';
import type { ErrorRecord } from '@/lib/types';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      data-testid={`copy-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}

export function Detail({
  record,
  prevId,
  nextId,
  codeColors,
}: {
  record: ErrorRecord;
  prevId: string | null;
  nextId: string | null;
  codeColors: CodeColors;
}) {
  const color = getRecordColor(record, codeColors);
  const json = JSON.stringify(record, null, 2);
  return (
    <div className="detail" data-testid="detail" data-kind={record.kind}>
      <header className="detail-header">
        <button type="button" onClick={() => navigateToId(null)} data-testid="back">
          ← Back
        </button>
        <div className="nav-pair">
          <button
            type="button"
            disabled={!prevId}
            onClick={() => prevId && navigateToId(prevId)}
            data-testid="prev"
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={!nextId}
            onClick={() => nextId && navigateToId(nextId)}
            data-testid="next"
          >
            Next →
          </button>
        </div>
      </header>

      <section
        className={`detail-card ${record.kind}`}
        style={{ borderLeftColor: color, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}
      >
        <Field label="Kind" value={record.kind} />
        <Field label="When" value={new Date(record.timestamp).toLocaleString()} />
        <Field label="ID" value={<code>{record.id}</code>} />
        {record.kind === 'network' ? (
          <>
            <Field label="Status" value={networkLabel(record)} />
            <Field label="Method" value={record.method} />
            <Field label="URL" value={<code className="break">{record.url}</code>} />
            {record.errorText && <Field label="Error" value={<code>{record.errorText}</code>} />}
          </>
        ) : (
          <>
            <Field label="Message" value={record.message} />
            <Field label="Source" value={<code>{record.source}</code>} />
            {record.stack && (
              <Field label="Stack" value={<pre className="stack-pre">{record.stack}</pre>} />
            )}
          </>
        )}
      </section>

      <div className="detail-actions">
        <CopyButton text={json} label="Copy JSON" />
        {record.kind === 'network' && (
          <CopyButton text={buildCurl(record)} label="Copy curl" />
        )}
      </div>
    </div>
  );
}
