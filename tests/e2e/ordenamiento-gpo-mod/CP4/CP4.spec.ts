import { test } from '@fixtures/base.fixture';
import { cp4Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP4', () => {
  test(`@CP4 CP4 - ${cp4Data.title}`, async ({ page }) => {
    await ejecutarCargaMenu(page, cp4Data);
  });
});
