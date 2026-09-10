import { fileTest as test } from '@fixtures/base.fixture';
import { cp38Data } from '../_shared/casos.data';
import { ejecutarEdicionPlantilla } from '../_shared/edicion-plantilla-flow';

test.describe('@catalogo @menu @administracion @edicion-plantilla @ordenamiento-gpo-mod @CP38', { tag: cp38Data.brandTag }, () => {
  test(`@CP38 CP38 - ${cp38Data.title}`, async ({}, testInfo) => {
    await ejecutarEdicionPlantilla(cp38Data, testInfo);
  });
});
