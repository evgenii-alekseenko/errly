import { pushError } from '@/lib/storage';
import { getSettings } from '@/lib/settings';
import {
  type ErrorRecord,
  RUNTIME_MESSAGE_MARKER,
  type RuntimePayload,
  type ShowToastMessage,
} from '@/lib/types';

async function notifyTab(tabId: number, record: ErrorRecord): Promise<void> {
  const message: ShowToastMessage = { type: 'show-toast', record };
  try {
    await browser.tabs.sendMessage(tabId, message);
  } catch {
    // Tab might be closed or have no content script (e.g. chrome:// pages).
  }
}

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
      await notifyTab(details.tabId, record);
    },
    { urls: ['<all_urls>'] },
  );

  browser.webRequest.onErrorOccurred.addListener(
    async (details) => {
      // Browser cancels and request aborts also flow here; skip them.
      if (details.error === 'net::ERR_ABORTED') return;
      if (!(await getSettings()).monitoring) return;
      if (!(await isActiveTab(details.tabId))) return;

      const record: ErrorRecord = {
        kind: 'network',
        id: crypto.randomUUID(),
        timestamp: details.timeStamp,
        statusCode: 0,
        errorText: details.error,
        method: details.method,
        url: details.url,
      };
      await pushError(record);
      await notifyTab(details.tabId, record);
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
    if (sender.tab?.id !== undefined) await notifyTab(sender.tab.id, record);
  });
});
