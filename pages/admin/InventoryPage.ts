import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

export class InventoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openFromHome(): Promise<void> {
    await expect(this.page.getByText(/Mis aplicaciones/i)).toBeVisible();
    await this.page.getByRole('button', { name: /Administraci[oó]n/i }).click();
    await expect(this.page).toHaveURL(/\/Administracion(?:$|[/?#])/i);
    await expect(this.page.getByText(/^Inventarios$/i)).toBeVisible();
    await this.page.getByText(/^Inventarios$/i).click();
    await expect(this.page).toHaveURL(/\/AdministracionInventario(?:$|[/?#])/i);
  }

  async expectInventoryMenuVisible(): Promise<void> {
    await expect(this.tab('Items')).toBeVisible();
    await expect(this.tab('Almacenes')).toBeVisible();
  }

  async openWarehouses(): Promise<void> {
    await this.tab('Almacenes').click();
    await expect(this.page.getByText(/Almacenes \(\d+\)/i)).toBeVisible();
    await expect(this.page.getByRole('button', { name: /Nuevo Almac[eé]n/i })).toBeVisible();
  }

  async expectItemsAndWarehousesVisible(): Promise<void> {
    await expect(this.tab('Items')).toBeVisible();
    await expect(this.tab('Almacenes')).toBeVisible();
    await this.openWarehouses();
    await expect(this.page.getByText(/^Todos$/i).first()).toBeVisible();
    await expect(this.page.getByText(/Nº Items/i).first()).toBeVisible();
  }

  async createWarehouse(name: string): Promise<void> {
    await this.openWarehouses();
    await this.page.getByRole('button', { name: /Nuevo Almac[eé]n/i }).click();
    await expect(this.page.getByPlaceholder('Ingrese nombre')).toBeVisible();

    await this.page.getByPlaceholder('Ingrese nombre').fill(name);
    const saveButton = this.page.getByRole('button', { name: /^Guardar$/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
  }

  async ensureWarehouseExists(name: string): Promise<void> {
    await this.openWarehouses();

    if ((await this.page.getByText(name, { exact: true }).count()) === 0) {
      await this.createWarehouse(name);
    }

    await this.expectWarehouseVisible(name);
  }

  async assignFirstVisibleItemToWarehouse(warehouseName: string): Promise<string> {
    await this.openAllWarehousesItems();

    const row = this.firstAssignableItemRow(warehouseName);
    await expect(row, 'Debe existir al menos un item visible para asignar').toBeVisible();

    const itemId = (await row.locator('td').first().innerText()).trim();
    await row.getByRole('button', { name: /Agregar .* almac[eé]n/i }).click();

    const modal = this.page.getByLabel(/Agregar a almac[eé]n/i);
    await expect(modal.getByText(/Seleccione los almacenes/i)).toBeVisible();

    await this.checkWarehouseOption(modal, warehouseName);
    const saveButton = modal.getByRole('button', { name: /^Guardar$/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(modal).not.toBeVisible();
    return itemId;
  }

  async openWarehouse(name: string): Promise<void> {
    await this.openWarehouses();
    await this.page.getByText(name, { exact: true }).first().click();
    await expect(this.page.getByText(new RegExp(`^${escapeRegExp(name)}$`, 'i')).first()).toBeVisible();
  }

  async expectItemVisibleInWarehouse(itemId: string, warehouseName: string): Promise<void> {
    await this.openWarehouse(warehouseName);
    await expect(this.page.getByText(itemId).first()).toBeVisible();
  }

  async expectWarehouseVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
  }

  private async openAllWarehousesItems(): Promise<void> {
    await this.openWarehouses();
    await this.page.getByText(/^Todos$/i).first().click();
    await expect(this.page.getByText(/Se muestran todos los/i)).toBeVisible();
    await expect(this.firstItemRow()).toBeVisible();
  }

  private firstItemRow(): Locator {
    return this.page.locator('tbody tr').filter({ hasText: /\d{12,}/ }).first();
  }

  private firstAssignableItemRow(warehouseName: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: /\d{12,}/ }).filter({ hasNotText: warehouseName }).first();
  }

  private async checkWarehouseOption(modal: Locator, warehouseName: string): Promise<void> {
    await expect(modal.getByText(warehouseName, { exact: true })).toBeVisible();

    const option = modal.locator('.assign-stores-checkbox-wrapper').filter({ hasText: warehouseName }).last();
    const checkbox = option.locator('input[type="checkbox"]').first();
    const checkboxControl = option.locator('.ant-checkbox-inner').first();

    await checkboxControl.click({ force: true });
    await expect(checkbox).toBeChecked();
  }

  private tab(name: 'Items' | 'Almacenes'): Locator {
    return this.page.locator('button.tab').filter({ hasText: name }).first();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
