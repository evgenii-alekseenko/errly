import type { CodeFilters } from './settings';
import type { ErrorRecord } from './types';

export function shouldShowRecord(
  record: ErrorRecord,
  codeFilters: CodeFilters,
): boolean {
  if (record.kind !== 'network') return true;
  if (record.statusCode === 0) return true;
  if (!(record.statusCode in codeFilters)) return true;
  return codeFilters[record.statusCode];
}
