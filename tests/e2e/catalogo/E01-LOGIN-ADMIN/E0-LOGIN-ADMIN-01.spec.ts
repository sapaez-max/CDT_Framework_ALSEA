import { env, validateRequiredEnv } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';
import { expect, test } from '@fixtures/base.fixture';

test.describe('@login @admin E0-LOGIN-ADMIN-01', () => {
  test('@login @admin @E0-LOGIN-ADMIN-01 validar que se tenga acceso al sistema', async ({ page }) => {
    validateRequiredEnv({ requireAuth: true });

    const loginPage = new LoginPage(page);

    await test.step('Given el usuario navega a la pantalla de inicio de sesion', async () => {
      await loginPage.gotoLogin();
      await loginPage.expectLoginScreenVisible();
    });

    await test.step('When el usuario se autentica con credenciales validas', async () => {
      await loginPage.authenticateFromCurrentLoginScreen(env.username, env.password);
    });

    await test.step('Then el sistema muestra una sesion autenticada con la cuenta esperada', async () => {
      await loginPage.expectAuthenticated(env.accountDisplayName);
      await expect(page.locator('body'), 'Debe permanecer visible la aplicacion autenticada').toBeVisible();
    });
  });
});

