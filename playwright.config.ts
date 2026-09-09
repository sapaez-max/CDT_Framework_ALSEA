import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { getRoleProjectConfigs } from './src/config/roles';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: env.expectTimeoutMs,
  },
  retries: env.retries,
  workers: env.workers,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/results.xml' }]
  ],
  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test',
    actionTimeout: env.actionTimeoutMs,
    navigationTimeout: env.navigationTimeoutMs,
    headless: env.headless,
    channel: env.browserChannel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: env.video,
  },
  outputDir: 'artifacts/test-results',
  projects: [
    ...getRoleProjectConfigs(),
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] }, trace: 'off', screenshot: 'off', video: 'off' },
    },
  ],
});
