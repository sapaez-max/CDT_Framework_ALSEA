import { test } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { cp40Data } from '../_shared/casos.data';
import { ejecutarCargaMenu } from '../_shared/carga-menu-flow';

test.describe('@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @CP40', { tag: cp40Data.brandTag }, () => {
  test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });

  test(`@CP40 CP40 - ${cp40Data.title}`, async ({ page, gmailClient }, testInfo) => {
    await ejecutarCargaMenu(page, cp40Data, testInfo, gmailClient);
  });
});
