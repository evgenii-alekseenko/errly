import type { CodeFilters } from './settings';
import type { ErrorRecord } from './types';

export type TypeFilter = 'all' | 'network' | 'runtime';

export function shouldShowRecord(
  record: ErrorRecord,
  codeFilters: CodeFilters,
): boolean {
  if (record.kind !== 'network') return true;
  if (record.statusCode === 0) return true;
  if (!(record.statusCode in codeFilters)) return true;
  return codeFilters[record.statusCode];
}

export function matchesType(record: ErrorRecord, type: TypeFilter): boolean {
  if (type === 'all') return true;
  return record.kind === type;
}
