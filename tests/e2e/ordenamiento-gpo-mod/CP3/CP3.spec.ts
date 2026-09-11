import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp3Data } from '../_shared/casos.data';
import { ejecutarCargaFiltros } from '../_shared/carga-filtros-flow';

test.describe('@catalogo @menu @administracion @carga-filtros @ordenamiento-gpo-mod @CP3', { tag: cp3Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP3 CP3 - ${cp3Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarCargaFiltros(page, cp3Data, testInfo, gmailClient);
  });
});
