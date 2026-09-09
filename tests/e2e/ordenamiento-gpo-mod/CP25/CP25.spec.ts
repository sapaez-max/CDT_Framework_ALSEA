import { test } from '@fixtures/base.fixture';
import { cp25Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP25', () => {
  test(`@CP25 CP25 - ${cp25Data.title}`, async ({ page }) => {
    await ejecutarDescargaPlantilla(page, cp25Data);
  });
});
