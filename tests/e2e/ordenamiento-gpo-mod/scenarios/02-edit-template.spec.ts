import { fileTest as test } from '@fixtures/base.fixture';
import { editTemplateCases } from '../data/cases.data';
import { editTemplateWorkflow } from '../workflows/edit-template.workflow';

for (const caseData of editTemplateCases) {
  test.describe(
    `@catalogo @menu @administracion @edicion-plantilla @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({}, testInfo) => {
        await editTemplateWorkflow(caseData, testInfo);
      });
    },
  );
}

