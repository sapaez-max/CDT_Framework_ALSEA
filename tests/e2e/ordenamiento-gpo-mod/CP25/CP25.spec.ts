import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp25Data } from '../_shared/casos.data';
import { ejecutarDescargaPlantilla } from '../_shared/ordenamiento-flow';

test.describe('@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @CP25', { tag: cp25Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP25 CP25 - ${cp25Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarDescargaPlantilla(page, gmailClient, testInfo, cp25Data);
  });
});
