import { type ErrorRecord, MAX_ERRORS } from './types';

export function appendCapped(
  current: ErrorRecord[],
  record: ErrorRecord,
  max = MAX_ERRORS,
): ErrorRecord[] {
  return [...current, record].slice(-max);
}
