import { test } from '@fixtures/base.fixture';
import { cp39Data } from '../_shared/casos.data';
import { ejecutarCargaFiltros } from '../_shared/carga-filtros-flow';

test.describe('@catalogo @menu @administracion @carga-filtros @ordenamiento-gpo-mod @CP39', { tag: cp39Data.brandTag }, () => {
  test(`@CP39 CP39 - ${cp39Data.title}`, async ({ page }, testInfo) => {
    await ejecutarCargaFiltros(page, cp39Data, testInfo);
  });
});
