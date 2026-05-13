import { test, expect, type BrowserContext, type Worker } from '@playwright/test';
import { launchExtension, setStorage } from './fixtures';

let context: BrowserContext;
let extensionId: string;
let serviceWorker: Worker;

test.beforeAll(async () => {
  ({ context, extensionId, serviceWorker } = await launchExtension());
});

test.afterAll(async () => {
  await context?.close();
});

const fullSettings = {
  monitoring: true,
  theme: 'light',
  notificationPosition: 'bottom-right',
  codeFilters: { 401: true, 403: true, 404: true, 405: true, 408: true, 500: true, 502: true, 503: true, 504: true },
  codeColors: {},
};

const seeded = [
  {
    kind: 'network',
    id: 'a',
    timestamp: Date.now() - 3000,
    statusCode: 404,
    method: 'GET',
    url: 'http://example.com/users/42',
  },
  {
    kind: 'network',
    id: 'b',
    timestamp: Date.now() - 2000,
    statusCode: 500,
    method: 'POST',
    url: 'http://example.com/orders',
  },
  {
    kind: 'runtime',
    id: 'c',
    timestamp: Date.now() - 1000,
    message: 'TypeError: cannot read user',
    source: 'app.js',
  },
];

test.beforeEach(async () => {
  await setStorage(serviceWorker, { errors: seeded, settings: fullSettings });
});

test('search filters cards live by url substring', async () => {
  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  await expect(history.locator('[data-testid="error-card"]')).toHaveCount(3);

  await history.locator('[data-testid="search-input"]').fill('orders');
  await expect(history.locator('[data-testid="error-card"]')).toHaveCount(1);
  await expect(history.locator('[data-testid="error-card"]').first()).toContainText('/orders');

  await history.waitForTimeout(2000);
});

test('search matches status code as string', async () => {
  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  await history.locator('[data-testid="search-input"]').fill('404');
  await expect(history.locator('[data-testid="error-card"]')).toHaveCount(1);
  await expect(history.locator('[data-testid="error-card"]').first()).toContainText('/users/42');

  await history.waitForTimeout(2000);
});

test('type filter Network hides runtime errors', async () => {
  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  await history.locator('[data-testid="type-network"]').click();
  const cards = history.locator('[data-testid="error-card"]');
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ has: history.locator('[data-kind="runtime"]') })).toHaveCount(0);

  await history.waitForTimeout(2000);
});

test('type filter Runtime hides network errors', async () => {
  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/errors.html`);

  await history.locator('[data-testid="type-runtime"]').click();
  const cards = history.locator('[data-testid="error-card"]');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('TypeError');

  await history.waitForTimeout(2000);
});
