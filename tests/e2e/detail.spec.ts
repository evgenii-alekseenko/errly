import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setMonitoring, setStorage } from './fixtures';
import type { ErrorRecord } from '@/lib/types';

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

async function seedErrors(records: ErrorRecord[]): Promise<void> {
  await setStorage(serviceWorker, { errors: records });
}

test('card click opens detail with all fields, back returns to list', async () => {
  await seedErrors([
    {
      kind: 'network',
      id: 'rec-net-1',
      timestamp: Date.now() - 1000,
      statusCode: 503,
      method: 'POST',
      url: 'https://api.example.com/widget',
    },
  ]);

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  const card = history.locator('[data-testid="error-card"]').first();
  await expect(card).toBeVisible();
  await card.click();

  const detail = history.locator('[data-testid="detail"][data-kind="network"]');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('503');
  await expect(detail).toContainText('POST');
  await expect(detail).toContainText('https://api.example.com/widget');
  await expect(detail).toContainText('rec-net-1');
  expect(history.url()).toContain('#/rec-net-1');

  await history.locator('[data-testid="back"]').click();
  await expect(history.locator('[data-testid="error-card"]')).toBeVisible();
  expect(history.url()).not.toContain('#/');

  await history.waitForTimeout(1500);
});

test('prev/next walks visible list in display order', async () => {
  const base = Date.now();
  await seedErrors([
    { kind: 'network', id: 'a', timestamp: base, statusCode: 404, method: 'GET', url: '/a' },
    { kind: 'network', id: 'b', timestamp: base + 1, statusCode: 500, method: 'GET', url: '/b' },
    { kind: 'network', id: 'c', timestamp: base + 2, statusCode: 502, method: 'GET', url: '/c' },
  ]);

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  // Display order is newest-first: c, b, a.
  await history.locator('[data-testid="error-card"]').first().click();
  const detail = history.locator('[data-testid="detail"]');
  await expect(detail).toContainText('/c');
  await expect(history.locator('[data-testid="prev"]')).toBeDisabled();
  await expect(history.locator('[data-testid="next"]')).toBeEnabled();

  await history.locator('[data-testid="next"]').click();
  await expect(detail).toContainText('/b');

  await history.locator('[data-testid="next"]').click();
  await expect(detail).toContainText('/a');
  await expect(history.locator('[data-testid="next"]')).toBeDisabled();

  await history.locator('[data-testid="prev"]').click();
  await expect(detail).toContainText('/b');

  await history.waitForTimeout(1000);
});

test('copy curl button shows on network detail, not on runtime', async () => {
  await seedErrors([
    {
      kind: 'network',
      id: 'net',
      timestamp: Date.now(),
      statusCode: 404,
      method: 'POST',
      url: '/api/x',
    },
    {
      kind: 'runtime',
      id: 'run',
      timestamp: Date.now() + 1,
      message: 'oops',
      source: 'file.js:1:1',
    },
  ]);

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html#/net`);
  await expect(history.locator('[data-testid="copy-copy-curl"]')).toBeVisible();
  await expect(history.locator('[data-testid="copy-copy-json"]')).toBeVisible();

  await history.goto(`chrome-extension://${extensionId}/errors.html#/run`);
  await expect(history.locator('[data-testid="copy-copy-curl"]')).toHaveCount(0);
  await expect(history.locator('[data-testid="copy-copy-json"]')).toBeVisible();

  await history.waitForTimeout(1500);
});

test('toast click opens detail in new tab', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const host = page.locator('errly-toast');
  const toast = host.locator('[data-testid="toast"]').filter({ hasText: '/missing' });
  await expect(toast).toBeVisible({ timeout: 5000 });

  const popupPromise = context.waitForEvent('page');
  await toast.click();
  const opened = await popupPromise;
  await opened.waitForLoadState('domcontentloaded');

  expect(opened.url()).toContain('/errors.html#/');
  await expect(opened.locator('[data-testid="detail"]')).toBeVisible({ timeout: 5000 });

  await opened.waitForTimeout(1500);
});
