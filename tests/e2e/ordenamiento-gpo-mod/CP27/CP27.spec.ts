import { test } from '@fixtures/base.fixture';
import { cp27Data } from '../_shared/casos.data';
import { ejecutarCargaFiltros } from '../_shared/carga-filtros-flow';

test.describe('@catalogo @menu @administracion @carga-filtros @ordenamiento-gpo-mod @CP27', { tag: cp27Data.brandTag }, () => {
  test(`@CP27 CP27 - ${cp27Data.title}`, async ({ page }, testInfo) => {
    await ejecutarCargaFiltros(page, cp27Data, testInfo);
  });
});
