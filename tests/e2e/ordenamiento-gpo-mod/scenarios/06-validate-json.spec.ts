import { test } from '@fixtures/base.fixture';
import { validateJsonCases } from '../data/cases.data';
import { validateJsonWorkflow } from '../workflows/validate-json.workflow';

for (const caseData of validateJsonCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@json', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test(`${caseData.id} - ${caseData.title}`, async ({ page }, testInfo) => {
        await validateJsonWorkflow(page, caseData, testInfo);
      });
    },
  );
}
