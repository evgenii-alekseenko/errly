import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setMonitoring } from './fixtures';

let context: BrowserContext;
let serviceWorker: Worker;

test.beforeAll(async () => {
  ({ context, serviceWorker } = await launchExtension());
});

test.beforeEach(async () => {
  await setMonitoring(serviceWorker, true);
});

test.afterAll(async () => {
  await context?.close();
});

test('toast appears on the page where the error happened', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  await expect(host).toBeAttached({ timeout: 5000 });

  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toContainText('404');
  await expect(toast).toContainText('GET');

  await page.waitForTimeout(2000);
});

test('toast auto-dismisses after timeout', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });

  await expect(toast).toBeHidden({ timeout: 8000 });
});

test('runtime error produces a toast on the page', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/throw.html');
  await page.waitForTimeout(500);

  const host = page.locator('errly-toast');
  const toast = host
    .locator('[data-testid="toast"][data-kind="runtime"]')
    .filter({ hasText: 'boom-from-throw' });
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toContainText('ERR');

  await page.waitForTimeout(2000);
});

test('toast action buttons present + copy click does not open detail', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });

  await expect(toast.locator('[data-testid="toast-copy"]')).toBeVisible();
  await expect(toast.locator('[data-testid="toast-shot"]')).toBeVisible();

  // Copy must stopPropagation: clicking it should NOT open the detail tab.
  const pagesBefore = context.pages().length;
  await toast.locator('[data-testid="toast-copy"]').click();
  await page.waitForTimeout(300);
  expect(context.pages().length).toBe(pagesBefore);

  await page.waitForTimeout(1500);
});
