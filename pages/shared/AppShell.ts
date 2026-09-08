import { expect, type Page } from '@playwright/test';

export class AppShell {
  constructor(private readonly page: Page) {}

  async expectVisible(): Promise<void> {
    await expect(this.page.locator('body')).toBeVisible();
  }

  async clickByRoleName(role: 'button' | 'link' | 'menuitem', name: string | RegExp): Promise<void> {
    await this.page.getByRole(role, { name }).click();
  }
}
