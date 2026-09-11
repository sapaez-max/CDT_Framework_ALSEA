import { test } from '@fixtures/base.fixture';
import { cp29Data } from '../_shared/casos.data';
import { ejecutarValidacionVisorCore } from '../_shared/visor-core-flow';

test.describe('@catalogo @menu @visor-core @ordenamiento-gpo-mod @CP29', { tag: cp29Data.brandTag }, () => {
  test(`@CP29 CP29 - ${cp29Data.title}`, async ({ page }, testInfo) => {
    await ejecutarValidacionVisorCore(page, cp29Data, testInfo);
  });
});
