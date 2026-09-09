import { test } from '@fixtures/base.fixture';
import { cp37Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP37', () => {
  test(`@CP37 CP37 - ${cp37Data.title}`, async ({ page }) => {
    await ejecutarDescargaPlantilla(page, cp37Data);
  });
});
