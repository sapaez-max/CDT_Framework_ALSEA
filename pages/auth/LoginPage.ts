import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '@config/env';
import { BasePage } from '@pages/base/BasePage';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto(env.login.path, { waitUntil: 'domcontentloaded' });
  }

  async expectLoginScreenVisible(): Promise<void> {
    const welcomeTitle = this.page.getByText(/te damos la bienvenida|sign in/i).first();
    const ingressButton = this.page.getByRole('button', { name: /^Ingresar$/i });
    const emailInput = this.usernameField();

    await expect(
      welcomeTitle.or(ingressButton).or(emailInput).first(),
      'Debe mostrarse la pantalla inicial de login o el formulario del proveedor de identidad',
    ).toBeVisible();
  }

  async login(username = env.username, password = env.password): Promise<void> {
    await this.gotoLogin();
    await this.expectLoginScreenVisible();
    await this.authenticateFromCurrentLoginScreen(username, password);
  }

  async authenticateFromCurrentLoginScreen(username = env.username, password = env.password): Promise<void> {
    await this.continueToIdentityProviderIfNeeded();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitCredentials();
    await this.handleStaySignedInPromptIfPresent();
  }

  async fillUsername(username: string): Promise<void> {
    const field = this.usernameField();
    await expect(field, 'Debe estar visible el campo de usuario/correo').toBeVisible();
    await field.fill(username);
    await this.nextButton().click();
  }

  async fillPassword(password: string): Promise<void> {
    const field = this.passwordField();
    await expect(field, 'Debe estar visible el campo de contrasena').toBeVisible();
    await field.fill(password);
  }

  async submitCredentials(): Promise<void> {
    const button = this.signInButton();
    await expect(button, 'Debe estar disponible el boton de inicio de sesion').toBeEnabled();
    await button.click();
  }

  async expectAuthenticated(accountName = env.accountDisplayName): Promise<void> {
    await expect(
      this.page,
      'Debe abandonar la pantalla de Login y el proveedor de identidad tras autenticarse',
    ).not.toHaveURL(/\/Login(?:$|[?#])|login\.microsoftonline\.com/i, { timeout: env.navigationTimeoutMs });

    const successMarker = this.authenticatedMarker(accountName);
    await expect(
      successMarker,
      'Debe mostrarse un elemento visible que confirme la cuenta autenticada',
    ).toBeVisible({ timeout: env.navigationTimeoutMs });
  }

  private async continueToIdentityProviderIfNeeded(): Promise<void> {
    const ingressButton = this.page.getByRole('button', { name: /^Ingresar$/i });
    if (await ingressButton.isVisible().catch(() => false)) {
      await ingressButton.click();
    }
  }

  private usernameField(): Locator {
    if (env.login.usernameSelector) return this.page.locator(env.login.usernameSelector).first();
    return this.page
      .getByLabel(/email|correo|usuario/i)
      .or(this.page.getByPlaceholder(/someone@example\.com|correo|email|usuario/i))
      .or(this.page.locator('input[name="loginfmt"]'))
      .or(this.page.locator('input[type="email"]'))
      .first();
  }

  private passwordField(): Locator {
    if (env.login.passwordSelector) return this.page.locator(env.login.passwordSelector).first();
    return this.page
      .getByLabel(/password|contrasena|contraseña/i)
      .or(this.page.locator('input[name="passwd"]'))
      .or(this.page.locator('input[type="password"]'))
      .first();
  }

  private nextButton(): Locator {
    if (env.login.submitSelector) return this.page.locator(env.login.submitSelector).first();
    return this.page
      .getByRole('button', { name: /next|siguiente|continuar/i })
      .or(this.page.locator('input[type="submit"]'))
      .first();
  }

  private signInButton(): Locator {
    if (env.login.submitSelector) return this.page.locator(env.login.submitSelector).first();
    return this.page
      .getByRole('button', { name: /sign in|iniciar sesion|iniciar sesión|ingresar/i })
      .or(this.page.locator('input[type="submit"]'))
      .first();
  }

  private async handleStaySignedInPromptIfPresent(): Promise<void> {
    const staySignedInPrompt = this.page.getByText(/stay signed in|mantener la sesion iniciada|mantener la sesión iniciada/i);
    const appeared = await staySignedInPrompt
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!appeared) return;

    const noButton = this.page.getByRole('button', { name: /^no$/i }).or(this.page.locator('#idBtn_Back')).first();
    await noButton.click();
  }

  private authenticatedMarker(accountName: string): Locator {
    if (env.login.successSelector) return this.page.locator(env.login.successSelector).first();
    if (env.login.accountSelector) return this.page.locator(env.login.accountSelector).first();

    const accountPattern = new RegExp(escapeRegExp(accountName), 'i');
    return this.page
      .getByText(accountPattern)
      .or(this.page.getByRole('button', { name: accountPattern }))
      .or(this.page.getByRole('link', { name: accountPattern }))
      .first();
  }
}
