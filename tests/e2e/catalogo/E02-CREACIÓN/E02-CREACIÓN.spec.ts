import { InventoryPage } from '@pages/admin/InventoryPage';
import { test } from '@fixtures/base.fixture';
import { authenticateConfiguredUser } from '../_shared/authenticated-session';

function warehouseName(): string {
  return `Almacen Automatizado Prueba`;
}

test.describe('@catalogo @admin @inventarios @almacenes E02-CREACIÓN', () => {
  test('@catalogo @admin @inventarios @almacenes @E02-CREACIÓN validar agregar un nuevo registro en Almacen', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const name = warehouseName();

    await test.step('Given el usuario accede al portal autenticado', async () => {
      await authenticateConfiguredUser(page);
    });

    await test.step('When el usuario navega a Administracion, Inventarios y Almacenes', async () => {
      await inventoryPage.openFromHome();
      await inventoryPage.openWarehouses();
    });

    await test.step('And el usuario crea un nuevo almacen', async () => {
      await inventoryPage.ensureWarehouseExists(name);
    });

    await test.step('Then el almacen creado se muestra en la barra de Almacenes', async () => {
      await inventoryPage.expectWarehouseVisible(name);
    });
  });
});
