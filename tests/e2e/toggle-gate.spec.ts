import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setMonitoring } from './fixtures';

let context: BrowserContext;
let extensionId: string;
let serviceWorker: Worker;

test.beforeAll(async () => {
  ({ context, extensionId, serviceWorker } = await launchExtension());
});

test.afterAll(async () => {
  await context?.close();
});

test('default is OFF, no rows captured', async () => {
  await setMonitoring(serviceWorker, false);

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(popup.locator('[data-testid="off-hint"]')).toBeVisible();
  await expect(popup.locator('[data-testid="error-row"]')).toHaveCount(0);

  await popup.waitForTimeout(2000);
});

test('flipping toggle ON enables capture', async () => {
  await setMonitoring(serviceWorker, false);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator('[data-testid="monitoring-toggle"]').check();
  await expect(popup.locator('[data-testid="off-hint"]')).toBeHidden();

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  await popup.bringToFront();
  const missingRow = popup
    .locator('[data-testid="error-row"]')
    .filter({ hasText: '/missing' });
  await expect(missingRow).toBeVisible({ timeout: 15000 });

  await popup.waitForTimeout(2000);
});
