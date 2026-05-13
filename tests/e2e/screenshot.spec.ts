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

test('popup screenshot button copies a PNG to clipboard', async () => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // A regular tab needs to be open so captureVisibleTab has a target.
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await popup.locator('[data-testid="popup-screenshot"]').click();

  await expect(popup.locator('[data-testid="popup-screenshot"]')).toContainText('Copied', {
    timeout: 3000,
  });

  await popup.waitForTimeout(1000);
});

test('toast screenshot button shows ✓ after copying', async () => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });

  const shot = toast.locator('[data-testid="toast-shot"]');
  await shot.click();

  await expect(shot).toHaveText('✓', { timeout: 3000 });

  await page.waitForTimeout(1500);
});
