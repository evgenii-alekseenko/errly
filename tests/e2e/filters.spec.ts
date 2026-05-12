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

test('unchecking 404 hides the row in popup', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const missingRow = popup
    .locator('[data-testid="error-row"]')
    .filter({ hasText: '/missing' });
  await expect(missingRow).toBeVisible({ timeout: 15000 });

  await popup.locator('[data-testid="code-404"]').uncheck();
  await expect(missingRow).toBeHidden();
  await expect(popup.locator('[data-testid="hidden-count"]')).toBeVisible();

  await popup.waitForTimeout(2000);
});

test('"All 4XX" button toggles every 4xx code', async () => {
  await setStorage(serviceWorker, {
    settings: {
      monitoring: true,
      theme: 'light',
      notificationPosition: 'bottom-right',
      codeFilters: { 401: true, 403: true, 404: true, 405: true, 408: true, 500: true, 502: true, 503: true, 504: true },
    },
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await popup.locator('[data-testid="group-4xx"]').click();

  for (const code of [401, 403, 404, 405, 408]) {
    await expect(popup.locator(`[data-testid="code-${code}"]`)).not.toBeChecked();
  }
  for (const code of [500, 502, 503, 504]) {
    await expect(popup.locator(`[data-testid="code-${code}"]`)).toBeChecked();
  }

  await popup.waitForTimeout(1500);
});

test('history page also respects filters', async () => {
  await setStorage(serviceWorker, {
    settings: {
      monitoring: true,
      theme: 'light',
      notificationPosition: 'bottom-right',
      codeFilters: { 401: true, 403: true, 404: false, 405: true, 408: true, 500: true, 502: true, 503: true, 504: true },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/history.html`);

  const missingCard = history
    .locator('[data-testid="error-card"]')
    .filter({ hasText: '/missing' });
  await expect(missingCard).toBeHidden({ timeout: 5000 });
  await expect(history.locator('[data-testid="hidden-note"]')).toBeVisible();

  await history.waitForTimeout(2000);
});
