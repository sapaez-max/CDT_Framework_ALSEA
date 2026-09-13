import { fileTest as test } from '@fixtures/base.fixture';
import { editTemplateCases } from '../data/cases.data';
import { editTemplateWorkflow } from '../workflows/edit-template.workflow';

for (const caseData of editTemplateCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@edicion-plantilla', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test(`${caseData.id} - ${caseData.title}`, async ({}, testInfo) => {
        await editTemplateWorkflow(caseData, testInfo);
      });
    },
  );
}

