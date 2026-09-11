import { test } from '@fixtures/base.fixture';
import { validateJsonCases } from '../data/cases.data';
import { validateJsonWorkflow } from '../workflows/validate-json.workflow';

for (const caseData of validateJsonCases) {
  test.describe(
    `@catalogo @menu @json @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page }, testInfo) => {
        await validateJsonWorkflow(page, caseData, testInfo);
      });
    },
  );
}
