import { shouldShowRecord } from '@/lib/filter';
import type { CodeFilters } from '@/lib/settings';
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

describe('shouldShowRecord', () => {
  const filters: CodeFilters = { 404: true, 500: false };

  it('passes enabled code', () => {
    expect(shouldShowRecord(net(404), filters)).toBe(true);
  });

  it('hides disabled code', () => {
    expect(shouldShowRecord(net(500), filters)).toBe(false);
  });

  it('shows codes not in filter list', () => {
    expect(shouldShowRecord(net(429), filters)).toBe(true);
  });

  it('always shows network-level failure (statusCode 0)', () => {
    expect(shouldShowRecord(net(0), { 0: false } as CodeFilters)).toBe(true);
  });

  it('always shows runtime errors', () => {
    expect(shouldShowRecord(runtime(), {})).toBe(true);
  });
});
