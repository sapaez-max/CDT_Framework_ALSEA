import { test } from '@fixtures/base.fixture';
import { cp15Data } from '../_shared/casos.data';
import { ejecutarCargaFiltros } from '../_shared/carga-filtros-flow';

test.describe('@catalogo @menu @administracion @carga-filtros @ordenamiento-gpo-mod @CP15', { tag: cp15Data.brandTag }, () => {
  test(`@CP15 CP15 - ${cp15Data.title}`, async ({ page }, testInfo) => {
    await ejecutarCargaFiltros(page, cp15Data, testInfo);
  });
});
