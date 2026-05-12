import { getRecordColor } from '@/lib/format';
import {
  COLOR_4XX,
  COLOR_5XX,
  COLOR_FALLBACK,
  COLOR_RUNTIME,
} from '@/lib/colors';
import type { CodeColors } from '@/lib/settings';
import type { ErrorRecord } from '@/lib/types';

function net(statusCode: number): ErrorRecord {
  return {
    kind: 'network',
    id: 'x',
    timestamp: 0,
    statusCode,
    method: 'GET',
    url: '/x',
  };
}

function runtime(): ErrorRecord {
  return {
    kind: 'runtime',
    id: 'r',
    timestamp: 0,
    message: 'm',
    source: 's',
  };
}

describe('getRecordColor', () => {
  it('uses user override when present', () => {
    const colors: CodeColors = { 404: '#00ff00' };
    expect(getRecordColor(net(404), colors)).toBe('#00ff00');
  });

  it('falls back to 4xx default', () => {
    expect(getRecordColor(net(404), {})).toBe(COLOR_4XX);
  });

  it('falls back to 5xx default', () => {
    expect(getRecordColor(net(500), {})).toBe(COLOR_5XX);
  });

  it('uses fallback color for status 0 (network failure)', () => {
    expect(getRecordColor(net(0), {})).toBe(COLOR_FALLBACK);
  });

  it('uses fallback for other status codes', () => {
    expect(getRecordColor(net(302), {})).toBe(COLOR_FALLBACK);
  });

  it('runtime always amber regardless of codeColors', () => {
    expect(getRecordColor(runtime(), { 500: '#000' })).toBe(COLOR_RUNTIME);
  });
});
