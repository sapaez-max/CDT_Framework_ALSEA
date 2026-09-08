import { env, validateRequiredEnv } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';
import type { Page } from '@fixtures/base.fixture';

export async function authenticateConfiguredUser(page: Page): Promise<void> {
  validateRequiredEnv({ requireAuth: true });

  const loginPage = new LoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.expectLoginScreenVisible();
  await loginPage.authenticateFromCurrentLoginScreen(env.username, env.password);
  await loginPage.expectAuthenticated(env.accountDisplayName);
}
