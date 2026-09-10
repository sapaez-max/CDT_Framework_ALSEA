import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { env } from '@config/env';
import { buildDiagnosticError } from '@shared/diagnostics/diagnostic-error';
import { GmailClient } from '@src/integrations/google/gmail-client';

type BaseFixtures = {
  appPage: Page;
  gmailClient: GmailClient;
};

async function withDiagnostics<T>(action: () => Promise<T>, page: Page, testInfo: TestInfo): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw await buildDiagnosticError(error, page, testInfo);
  }
}

export const test = base.extend<BaseFixtures>({
  page: async ({ page }, use, testInfo) => {
    await withDiagnostics(() => use(page), page, testInfo);
  },
  appPage: async ({ page }, use) => {
    await use(page);
  },
  gmailClient: async ({}, use) => {
    await use(await GmailClient.create());
  },
});

test.beforeEach(async ({ page }) => {
  if (!env.autoGoto) return;
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
});

export { expect };
export type { Page, TestInfo };
