import { test } from '@fixtures/base.fixture';
import { cp17Data } from '../_shared/casos.data';
import { ejecutarValidacionVisorCore } from '../_shared/visor-core-flow';

test.describe('@catalogo @menu @visor-core @ordenamiento-gpo-mod @CP17', { tag: cp17Data.brandTag }, () => {
  test(`@CP17 CP17 - ${cp17Data.title}`, async ({ page }, testInfo) => {
    await ejecutarValidacionVisorCore(page, cp17Data, testInfo);
  });
});
