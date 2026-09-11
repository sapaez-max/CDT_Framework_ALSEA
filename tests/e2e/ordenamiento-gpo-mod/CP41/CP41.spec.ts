import { test } from '@fixtures/base.fixture';
import { cp41Data } from '../_shared/casos.data';
import { ejecutarValidacionVisorCore } from '../_shared/visor-core-flow';

test.describe('@catalogo @menu @visor-core @ordenamiento-gpo-mod @CP41', { tag: cp41Data.brandTag }, () => {
  test(`@CP41 CP41 - ${cp41Data.title}`, async ({ page }, testInfo) => {
    await ejecutarValidacionVisorCore(page, cp41Data, testInfo);
  });
});
