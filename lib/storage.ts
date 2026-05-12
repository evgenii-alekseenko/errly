import { type ErrorRecord, STORAGE_KEY } from './types';
import { appendCapped } from './cap';

const errorsItem = storage.defineItem<ErrorRecord[]>(`local:${STORAGE_KEY}`, {
  fallback: [],
});

export async function getErrors(): Promise<ErrorRecord[]> {
  return errorsItem.getValue();
}

export async function pushError(record: ErrorRecord): Promise<void> {
  const current = await errorsItem.getValue();
  await errorsItem.setValue(appendCapped(current, record));
}

export function watchErrors(cb: (records: ErrorRecord[]) => void): () => void {
  return errorsItem.watch((newValue: ErrorRecord[] | null) => {
    cb(newValue ?? []);
  });
}
