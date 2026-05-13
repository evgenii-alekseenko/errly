import type { NetworkError } from './types';

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function buildCurl(record: Pick<NetworkError, 'method' | 'url'>): string {
  const parts = ['curl'];
  if (record.method && record.method.toUpperCase() !== 'GET') {
    parts.push('-X', record.method.toUpperCase());
  }
  parts.push(shellEscape(record.url));
  return parts.join(' ');
}
