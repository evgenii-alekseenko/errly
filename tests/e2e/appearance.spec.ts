import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setMonitoring, setStorage } from './fixtures';

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

test('selecting dark theme sets data-theme on popup root', async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await popup.locator('[data-testid="theme-dark"]').check();
  await expect(popup.locator('html')).toHaveAttribute('data-theme', 'dark');

  await popup.locator('[data-testid="theme-light"]').check();
  await expect(popup.locator('html')).toHaveAttribute('data-theme', 'light');

  await popup.waitForTimeout(2000);
});

test('changing notification position moves the toast stack', async () => {
  await setStorage(serviceWorker, {
    settings: { monitoring: true, theme: 'light', notificationPosition: 'top-left' },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('error-logger-toast');
  const stack = host.locator('[data-testid="toast-stack"]');
  await expect(stack).toHaveAttribute('data-position', 'top-left', { timeout: 5000 });

  await page.waitForTimeout(2000);
});
