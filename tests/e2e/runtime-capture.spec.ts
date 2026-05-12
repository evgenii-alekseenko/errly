import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../../.output/chrome-mv3');

let context: BrowserContext;
let extensionId: string;

test.beforeAll(async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    slowMo: 800,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  extensionId = sw.url().split('/')[2];
});

test.afterAll(async () => {
  await context?.close();
});

test('captures uncaught throw from page', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/throw.html');
  await page.waitForTimeout(200);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const runtimeRow = popup
    .locator('[data-testid="error-row"][data-kind="runtime"]')
    .filter({ hasText: 'boom-from-throw' });
  await expect(runtimeRow).toBeVisible({ timeout: 15000 });
  await expect(runtimeRow).toContainText('ERR');

  await popup.waitForTimeout(3000);
});

test('captures unhandled promise rejection', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/reject.html');
  await page.waitForTimeout(200);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const runtimeRow = popup
    .locator('[data-testid="error-row"][data-kind="runtime"]')
    .filter({ hasText: 'boom-from-reject' });
  await expect(runtimeRow).toBeVisible({ timeout: 15000 });
  await expect(runtimeRow).toContainText('promise');

  await popup.waitForTimeout(3000);
});
