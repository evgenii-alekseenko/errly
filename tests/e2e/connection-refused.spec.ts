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

test('captures network-level failure (ERR_CONNECTION_REFUSED)', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/refused.html');
  await page.waitForLoadState('networkidle');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const refusedRow = popup
    .locator('[data-testid="error-row"][data-kind="network"]')
    .filter({ hasText: 'refused-target' });
  await expect(refusedRow).toBeVisible({ timeout: 15000 });
  await expect(refusedRow).toContainText(/CONNECTION_REFUSED|REFUSED/);

  await popup.waitForTimeout(2000);
});
