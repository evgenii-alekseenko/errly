import { pushError } from '@/lib/storage';
import type { ErrorRecord } from '@/lib/types';

export default defineBackground(() => {
  browser.webRequest.onCompleted.addListener(
    async (details) => {
      if (details.statusCode < 400) return;
      if (details.tabId < 0) return;

      const [activeTab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (!activeTab || activeTab.id !== details.tabId) return;

      const record: ErrorRecord = {
        id: crypto.randomUUID(),
        timestamp: details.timeStamp,
        statusCode: details.statusCode,
        method: details.method,
        url: details.url,
      };
      await pushError(record);
    },
    { urls: ['<all_urls>'] },
  );
});
