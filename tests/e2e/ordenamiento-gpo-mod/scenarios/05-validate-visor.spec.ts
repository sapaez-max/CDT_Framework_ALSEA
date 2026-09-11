import { test } from '@fixtures/base.fixture';
import { validateVisorCases } from '../data/cases.data';
import { validateVisorWorkflow } from '../workflows/validate-visor.workflow';

for (const caseData of validateVisorCases) {
  test.describe(
    `@catalogo @menu @visor-core @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page }, testInfo) => {
        await validateVisorWorkflow(page, caseData, testInfo);
      });
    },
  );
}

