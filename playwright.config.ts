import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import {
  chainedDownloadTestPattern,
  chainedEditTestPattern,
  chainedFilterLoadTestPattern,
  chainedMenuLoadTestPattern,
  chainedCoreViewerTestPattern,
  getRoleProjectConfigs,
} from './src/config/roles';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './setup/global-auth-check.ts',
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
      name: 'ordenamiento-descarga',
      testMatch: chainedDownloadTestPattern,
      use: {
        ...devices['Desktop Chrome'],
        storageState: env.authEnabled ? env.authStatePath : undefined,
      },
      metadata: { roleName: env.authRole },
    },
    {
      name: 'ordenamiento-edicion',
      testMatch: chainedEditTestPattern,
    },
    {
      name: 'ordenamiento-carga-filtros',
      testMatch: chainedFilterLoadTestPattern,
      use: {
        ...devices['Desktop Chrome'],
        storageState: env.authEnabled ? env.authStatePath : undefined,
      },
      metadata: { roleName: env.authRole },
    },
    {
      name: 'ordenamiento-carga-menu',
      testMatch: chainedMenuLoadTestPattern,
      use: {
        ...devices['Desktop Chrome'],
        storageState: env.authEnabled ? env.authStatePath : undefined,
      },
      metadata: { roleName: env.authRole },
    },
    {
      name: 'ordenamiento-visor-core',
      testMatch: chainedCoreViewerTestPattern,
      use: {
        ...devices['Desktop Chrome'],
        storageState: env.authEnabled ? env.authStatePath : undefined,
      },
      metadata: { roleName: env.authRole },
    },
  ],
});
