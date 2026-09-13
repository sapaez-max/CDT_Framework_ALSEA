import { test } from '@fixtures/base.fixture';
import { validateVisorCases } from '../data/cases.data';
import { validateVisorWorkflow } from '../workflows/validate-visor.workflow';

for (const caseData of validateVisorCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@visor-core', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test(`${caseData.id} - ${caseData.title}`, async ({ page }, testInfo) => {
        await validateVisorWorkflow(page, caseData, testInfo);
      });
    },
  );
}

