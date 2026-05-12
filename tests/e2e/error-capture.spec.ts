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

test('captures a 404 from fixture page and shows it in popup', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const missingRow = popup
    .locator('[data-testid="error-row"]')
    .filter({ hasText: '/missing' });
  await expect(missingRow).toBeVisible({ timeout: 15000 });
  await expect(missingRow).toContainText('404');
  await expect(missingRow).toContainText('GET');

  await popup.waitForTimeout(3000);
});
