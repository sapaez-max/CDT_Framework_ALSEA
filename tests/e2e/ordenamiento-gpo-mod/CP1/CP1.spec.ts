import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp1Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP1', { tag: cp1Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP1 CP1 - ${cp1Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarDescargaPlantilla(page, gmailClient, testInfo, cp1Data);
  });
});
