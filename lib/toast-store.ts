import type { ErrorRecord } from './types';

export const TOAST_DISMISS_MS = 5000;
export const TOAST_MAX = 3;

type Listener = (records: ErrorRecord[]) => void;

const listeners = new Set<Listener>();
let queue: ErrorRecord[] = [];

function emit() {
  for (const l of listeners) l(queue);
}

export function pushToast(record: ErrorRecord): void {
  queue = [...queue, record].slice(-TOAST_MAX);
  emit();
  setTimeout(() => {
    queue = queue.filter((t) => t.id !== record.id);
    emit();
  }, TOAST_DISMISS_MS);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue);
  return () => {
    listeners.delete(listener);
  };
}
