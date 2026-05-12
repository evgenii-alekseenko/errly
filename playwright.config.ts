import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3210',
  },
  webServer: {
    command: 'node tests/e2e/fixture-server.mjs',
    port: 3210,
    reuseExistingServer: !process.env.CI,
  },
});
