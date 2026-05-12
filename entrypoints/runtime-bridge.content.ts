import { RUNTIME_MESSAGE_MARKER, type RuntimePayload } from '@/lib/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      const data = event.data as RuntimePayload | undefined;
      if (!data || data.marker !== RUNTIME_MESSAGE_MARKER) return;
      browser.runtime.sendMessage(data);
    });
  },
});
