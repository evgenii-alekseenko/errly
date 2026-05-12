import type { ErrorRecord } from './types';

export function matchesSearch(record: ErrorRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay: string[] = [];
  if (record.kind === 'network') {
    hay.push(record.url, String(record.statusCode), record.method);
    if (record.errorText) hay.push(record.errorText);
  } else {
    hay.push(record.message, record.source);
    if (record.stack) hay.push(record.stack);
  }
  return hay.some((s) => s.toLowerCase().includes(q));
}
