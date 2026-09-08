import { expect, Page } from '@playwright/test';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.page.getByTestId('inventory-container')).toBeVisible();
  }

  async addBackpackToCart() {
    await this.page.getByTestId('add-to-cart-sauce-labs-backpack').click();
  }

  async expectCartCount(count: number) {
    await expect(this.page.getByTestId('shopping-cart-badge')).toHaveText(String(count));
  }

  async openCart() {
    await this.page.getByTestId('shopping-cart-link').click();
  }

  async expectBackpackInCart() {
    await expect(this.page.getByTestId('inventory-item-name')).toContainText('Sauce Labs Backpack');
  }
}
