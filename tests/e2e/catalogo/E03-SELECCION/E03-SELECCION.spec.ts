import { InventoryPage } from '@pages/admin/InventoryPage';
import { test } from '@fixtures/base.fixture';
import { authenticateConfiguredUser } from '../_shared/authenticated-session';

const warehouseName = 'Almacen Automatizado Prueba';

test.describe('@catalogo @admin @inventarios @almacenes E03-SELECCION', () => {
  test('@catalogo @admin @inventarios @almacenes @E03-SELECCION validar que se pueda agregar un item al nuevo almacen creado', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    let itemId = '';

    await test.step('Given el usuario accede al sitio autenticado', async () => {
      await authenticateConfiguredUser(page);
    });

    await test.step('And el usuario visualiza el almacen creado', async () => {
      await inventoryPage.openFromHome();
      await inventoryPage.ensureWarehouseExists(warehouseName);
    });

    await test.step('When el usuario selecciona Todos y agrega un item al almacen', async () => {
      itemId = await inventoryPage.assignFirstVisibleItemToWarehouse(warehouseName);
    });

    await test.step('Then al seleccionar el almacen se visualiza el item asignado', async () => {
      await inventoryPage.expectItemVisibleInWarehouse(itemId, warehouseName);
    });
  });
});
