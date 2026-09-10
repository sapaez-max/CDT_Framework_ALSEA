import { fileTest as test } from '@fixtures/base.fixture';
import { cp14Data } from '../_shared/casos.data';
import { ejecutarEdicionPlantilla } from '../_shared/edicion-plantilla-flow';

test.describe('@catalogo @menu @administracion @edicion-plantilla @ordenamiento-gpo-mod @CP14', { tag: cp14Data.brandTag }, () => {
  test(`@CP14 CP14 - ${cp14Data.title}`, async ({}, testInfo) => {
    await ejecutarEdicionPlantilla(cp14Data, testInfo);
  });
});
