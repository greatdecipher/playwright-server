import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000, // 2 minutes timeout for tests
  retries: 0,
  workers: 1, // Run tests sequentially
  reporter: 'list',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
