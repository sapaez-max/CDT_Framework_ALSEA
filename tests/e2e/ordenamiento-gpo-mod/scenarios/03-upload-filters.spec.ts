import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { uploadFiltersCases } from '../data/cases.data';
import { uploadFiltersWorkflow } from '../workflows/upload-filters.workflow';

for (const caseData of uploadFiltersCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@carga-filtros', `@${caseData.id}`, caseData.brandTag] },
    () => {
      if (caseData.expectedEmailSubject) {
        test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      }
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await uploadFiltersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}

