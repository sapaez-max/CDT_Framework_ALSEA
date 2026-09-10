import { fileTest as test } from '@fixtures/base.fixture';
import { cp26Data } from '../_shared/casos.data';
import { ejecutarEdicionPlantilla } from '../_shared/edicion-plantilla-flow';

test.describe('@catalogo @menu @administracion @edicion-plantilla @ordenamiento-gpo-mod @CP26', { tag: cp26Data.brandTag }, () => {
  test(`@CP26 CP26 - ${cp26Data.title}`, async ({}, testInfo) => {
    await ejecutarEdicionPlantilla(cp26Data, testInfo);
  });
});
