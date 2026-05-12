import { COLOR_4XX, COLOR_5XX, COLOR_FALLBACK, COLOR_RUNTIME } from './colors';
import type { CodeColors } from './settings';
import type { ErrorRecord, NetworkError } from './types';

export function networkLabel(record: Pick<NetworkError, 'statusCode' | 'errorText'>): string {
  if (record.statusCode > 0) return String(record.statusCode);
  return record.errorText?.replace(/^net::ERR_/, '') ?? 'ERR';
}

export function getRecordColor(record: ErrorRecord, codeColors: CodeColors): string {
  if (record.kind === 'runtime') return COLOR_RUNTIME;
  const override = codeColors[record.statusCode];
  if (override) return override;
  if (record.statusCode >= 500 && record.statusCode < 600) return COLOR_5XX;
  if (record.statusCode >= 400 && record.statusCode < 500) return COLOR_4XX;
  return COLOR_FALLBACK;
}
