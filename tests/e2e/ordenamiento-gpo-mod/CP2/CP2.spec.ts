import { fileTest as test } from '@fixtures/base.fixture';
import { cp2Data } from '../_shared/casos.data';
import { ejecutarEdicionPlantilla } from '../_shared/edicion-plantilla-flow';

test.describe('@catalogo @menu @administracion @edicion-plantilla @ordenamiento-gpo-mod @CP2', { tag: cp2Data.brandTag }, () => {
  test(`@CP2 CP2 - ${cp2Data.title}`, async ({}, testInfo) => {
    await ejecutarEdicionPlantilla(cp2Data, testInfo);
  });
});
