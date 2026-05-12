import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setMonitoring } from './fixtures';

let context: BrowserContext;
let extensionId: string;
let serviceWorker: Worker;

test.beforeAll(async () => {
  ({ context, extensionId, serviceWorker } = await launchExtension());
});

test.beforeEach(async () => {
  await setMonitoring(serviceWorker, true);
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
