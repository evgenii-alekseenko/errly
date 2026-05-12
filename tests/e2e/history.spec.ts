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

test('history page shows captured errors and clears on demand', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/error.html');
  await page.waitForLoadState('networkidle');

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/history.html`);

  const networkCard = history
    .locator('[data-testid="error-card"][data-kind="network"]')
    .filter({ hasText: '/missing' });
  await expect(networkCard).toBeVisible({ timeout: 15000 });
  await expect(networkCard).toContainText('404');

  const clearBtn = history.locator('[data-testid="clear-button"]');
  await expect(clearBtn).toBeEnabled();
  await clearBtn.click();

  await expect(history.locator('[data-testid="empty"]')).toBeVisible();
  await expect(history.locator('[data-testid="error-card"]')).toHaveCount(0);
  await expect(clearBtn).toBeDisabled();

  await history.waitForTimeout(2000);
});

test('runtime stack trace expands via details', async () => {
  const page = await context.newPage();
  await page.goto('http://localhost:3210/throw.html');
  await page.waitForTimeout(200);

  const history = await context.newPage();
  await history.goto(`chrome-extension://${extensionId}/history.html`);

  const runtimeCard = history
    .locator('[data-testid="error-card"][data-kind="runtime"]')
    .filter({ hasText: 'boom-from-throw' });
  await expect(runtimeCard).toBeVisible({ timeout: 15000 });

  const stackDetails = runtimeCard.locator('details.stack');
  await expect(stackDetails).toBeVisible();
  await stackDetails.locator('summary').click();
  await expect(stackDetails.locator('pre')).toBeVisible();

  await history.waitForTimeout(2000);
});
