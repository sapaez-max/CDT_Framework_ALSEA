import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp16Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP16', { tag: cp16Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP16 CP16 - ${cp16Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarCargaMenu(page, cp16Data, testInfo, gmailClient);
  });
});
