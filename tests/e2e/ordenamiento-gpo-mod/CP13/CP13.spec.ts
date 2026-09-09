import { test } from '@fixtures/base.fixture';
import { cp13Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP13', () => {
  test(`@CP13 CP13 - ${cp13Data.title}`, async ({ page }) => {
    await ejecutarDescargaPlantilla(page, cp13Data);
  });
});
