type Base = {
  id: string;
  timestamp: number;
};

export type NetworkError = Base & {
  kind: 'network';
  statusCode: number;
  method: string;
  url: string;
};

export type RuntimeError = Base & {
  kind: 'runtime';
  message: string;
  source: string;
  stack?: string;
};

export type ErrorRecord = NetworkError | RuntimeError;

export const MAX_ERRORS = 20;
export const STORAGE_KEY = 'errors';

export const RUNTIME_MESSAGE_MARKER = '__errorLogger__';

export type RuntimePayload = {
  marker: typeof RUNTIME_MESSAGE_MARKER;
  message: string;
  source: string;
  stack?: string;
};
