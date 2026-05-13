type Base = {
  id: string;
  timestamp: number;
};

export type NetworkError = Base & {
  kind: 'network';
  statusCode: number;
  errorText?: string;
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

export type ShowToastMessage = {
  type: 'show-toast';
  record: ErrorRecord;
};

export type OpenDetailMessage = {
  type: 'open-detail';
  id: string;
};

// Request data URL of current tab screenshot. Background responds with the
// PNG data URL; the caller (content script) writes to clipboard with a fresh
// user-gesture-derived activation.
export type CaptureScreenshotMessage = {
  type: 'capture-screenshot';
};
