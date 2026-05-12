export type ErrorRecord = {
  id: string;
  timestamp: number;
  statusCode: number;
  method: string;
  url: string;
};

export const MAX_ERRORS = 20;
export const STORAGE_KEY = 'errors';
