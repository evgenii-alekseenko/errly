import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setStorage } from './fixtures';

let context: BrowserContext;
let extensionId: string;
let serviceWorker: Worker;

test.beforeAll(async () => {
  ({ context, extensionId, serviceWorker } = await launchExtension());
});

test.beforeEach(async () => {
  await setStorage(serviceWorker, { errors: [] });
});

test.afterAll(async () => {
  await context?.close();
});

test('custom color for 404 paints toast left border', async () => {
  await setStorage(serviceWorker, {
    settings: {
      monitoring: true,
      theme: 'light',
      notificationPosition: 'bottom-right',
      codeFilters: { 401: true, 403: true, 404: true, 405: true, 408: true, 500: true, 502: true, 503: true, 504: true },
      codeColors: { 404: '#00ff00' },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toHaveCSS('border-left-color', 'rgb(0, 255, 0)');

  await page.waitForTimeout(2000);
});

test('custom color paints the history card', async () => {
  await setStorage(serviceWorker, {
    settings: {
      monitoring: true,
      theme: 'light',
      notificationPosition: 'bottom-right',
      codeFilters: { 401: true, 403: true, 404: true, 405: true, 408: true, 500: true, 502: true, 503: true, 504: true },
      codeColors: { 404: '#0000ff' },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  const card = history
    .locator('[data-testid="error-card"]')
    .filter({ hasText: '/missing' })
    .first();
  await expect(card).toBeVisible({ timeout: 5000 });
  await expect(card).toHaveCSS('border-left-color', 'rgb(0, 0, 255)');

  await history.waitForTimeout(2000);
});
