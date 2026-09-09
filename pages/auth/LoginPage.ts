import { expect, type Page } from '@playwright/test';
import { env, validateRequiredEnv } from '@config/env';
import { BasePage } from '@pages/base/BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(): Promise<void> {
    validateRequiredEnv();
    await this.page.goto(env.login.path, { waitUntil: 'domcontentloaded' });
  }

  async expectLoginScreenVisible(): Promise<void> {
    await expect(this.page.locator(env.login.usernameSelector)).toBeVisible();
    await expect(this.page.locator(env.login.passwordSelector)).toBeVisible();
    await expect(this.page.locator(env.login.submitSelector)).toBeVisible();
  }

  async expectAuthenticated(accountName = env.accountDisplayName): Promise<void> {
    const target = new URL(env.login.landingPath, env.baseUrl);
    await expect(this.page).toHaveURL(
      url => url.origin === target.origin && url.pathname === target.pathname,
    );

    const account = env.login.accountSelector
      ? this.page.locator(env.login.accountSelector)
      : this.page.getByText(accountName, { exact: true });

    await expect(account).toBeVisible();
    await expect(account).toHaveText(accountName);

    if (env.login.successSelector) {
      await expect(this.page.locator(env.login.successSelector)).toBeVisible();
    }
  }
}
