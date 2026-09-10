import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp37Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP37', { tag: cp37Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP37 CP37 - ${cp37Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarDescargaPlantilla(page, gmailClient, testInfo, cp37Data);
  });
});
