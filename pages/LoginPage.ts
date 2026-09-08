import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(baseUrl: string) {
    await this.page.goto(baseUrl);
  }

  async login(username: string, password: string) {
    await this.page.getByTestId('username').fill(username);
    await this.page.getByTestId('password').fill(password);
    await this.page.getByTestId('login-button').click();
  }

  async expectLoginError() {
    await expect(this.page.getByTestId('error')).toBeVisible();
  }
}
