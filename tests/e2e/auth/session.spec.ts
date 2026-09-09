import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';

test('@smoke @admin la sesion guardada permite acceder a landing sin login', async ({ page }) => {
  test.skip(!env.authEnabled, 'La reutilizacion requiere AUTH_ENABLED=true');
  await page.goto(env.login.landingPath);
  await new LoginPage(page).expectAuthenticated();
});
