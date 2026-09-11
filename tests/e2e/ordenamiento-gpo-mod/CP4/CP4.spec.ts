import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp4Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP4', { tag: cp4Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP4 CP4 - ${cp4Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarCargaMenu(page, cp4Data, testInfo, gmailClient);
  });
});
