import { test } from '@fixtures/base.fixture';
import { cp5Data } from '../_shared/casos.data';
import { ejecutarValidacionVisorCore } from '../_shared/visor-core-flow';

test.describe('@catalogo @menu @visor-core @ordenamiento-gpo-mod @CP5', { tag: cp5Data.brandTag }, () => {
  test(`@CP5 CP5 - ${cp5Data.title}`, async ({ page }, testInfo) => {
    await ejecutarValidacionVisorCore(page, cp5Data, testInfo);
  });
});
