import { test } from '@fixtures/base.fixture';
import { cp1Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP1', () => {
  test(`@CP1 CP1 - ${cp1Data.title}`, async ({ page }) => {
    await ejecutarDescargaPlantilla(page, cp1Data);
  });
});
