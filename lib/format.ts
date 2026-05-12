import type { NetworkError } from './types';

export function networkLabel(record: Pick<NetworkError, 'statusCode' | 'errorText'>): string {
  if (record.statusCode > 0) return String(record.statusCode);
  return record.errorText?.replace(/^net::ERR_/, '') ?? 'ERR';
}
