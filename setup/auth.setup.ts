import { test as setup } from '@playwright/test';
import path from 'path';
import { env, validateRequiredEnv } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';

setup('authenticate default user', async ({ page }) => {
  if (!env.authEnabled) {
    setup.skip(true, 'AUTH_ENABLED=false; no se genera storage state.');
  }

  validateRequiredEnv({ requireAuth: true });
  await new LoginPage(page).login();
  await page.context().storageState({ path: path.resolve('.auth', `${env.authRole}.json`) });
});
