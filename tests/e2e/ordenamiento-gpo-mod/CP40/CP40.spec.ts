import { test } from '@fixtures/base.fixture';
import { cp40Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP40', () => {
  test(`@CP40 CP40 - ${cp40Data.title}`, async ({ page }) => {
    await ejecutarCargaMenu(page, cp40Data);
  });
});
