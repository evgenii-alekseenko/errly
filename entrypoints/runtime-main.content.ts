import { RUNTIME_MESSAGE_MARKER, type RuntimePayload } from '@/lib/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    function send(payload: Omit<RuntimePayload, 'marker'>) {
      window.postMessage({ marker: RUNTIME_MESSAGE_MARKER, ...payload }, '*');
    }

    window.addEventListener('error', (event) => {
      const err = event.error;
      send({
        message: event.message || String(err?.message ?? err ?? 'Error'),
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: err?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
          ? reason
          : (() => {
              try {
                return JSON.stringify(reason);
              } catch {
                return String(reason);
              }
            })();
      send({
        message: `Unhandled rejection: ${message}`,
        source: 'promise',
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });
  },
});
