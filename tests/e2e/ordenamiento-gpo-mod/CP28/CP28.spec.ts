import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp28Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP28', { tag: cp28Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP28 CP28 - ${cp28Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarCargaMenu(page, cp28Data, testInfo, gmailClient);
  });
});
