import { chromium, type BrowserContext, type Worker } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const extensionPath = path.resolve(__dirname, '../../.output/chrome-mv3');

export type ExtensionContext = {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
};

export async function launchExtension(): Promise<ExtensionContext> {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    slowMo: 800,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) serviceWorker = await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];
  return { context, extensionId, serviceWorker };
}

export async function setStorage(
  serviceWorker: Worker,
  patch: Record<string, unknown>,
): Promise<void> {
  await serviceWorker.evaluate(async (data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (globalThis as any).chrome.storage.local.set(data);
  }, patch);
}

export async function setMonitoring(
  serviceWorker: Worker,
  monitoring: boolean,
): Promise<void> {
  await setStorage(serviceWorker, { settings: { monitoring } });
}
