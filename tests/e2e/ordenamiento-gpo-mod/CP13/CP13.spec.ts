import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp13Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP13', { tag: cp13Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP13 CP13 - ${cp13Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarDescargaPlantilla(page, gmailClient, testInfo, cp13Data);
  });
});
