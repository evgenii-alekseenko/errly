import { pushError } from '@/lib/storage';
import { getSettings } from '@/lib/settings';
import {
  type ErrorRecord,
  RUNTIME_MESSAGE_MARKER,
  type RuntimePayload,
} from '@/lib/types';

async function isActiveTab(tabId: number | undefined): Promise<boolean> {
  if (tabId === undefined || tabId < 0) return false;
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return !!activeTab && activeTab.id === tabId;
}

export default defineBackground(() => {
  browser.webRequest.onCompleted.addListener(
    async (details) => {
      if (details.statusCode < 400) return;
      if (!(await getSettings()).monitoring) return;
      if (!(await isActiveTab(details.tabId))) return;

      const record: ErrorRecord = {
        kind: 'network',
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

  browser.runtime.onMessage.addListener(async (message, sender) => {
    const payload = message as RuntimePayload | undefined;
    if (!payload || payload.marker !== RUNTIME_MESSAGE_MARKER) return;
    if (!(await getSettings()).monitoring) return;
    if (!(await isActiveTab(sender.tab?.id))) return;

    const record: ErrorRecord = {
      kind: 'runtime',
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message: payload.message,
      source: payload.source,
      stack: payload.stack,
    };
    await pushError(record);
  });
});
