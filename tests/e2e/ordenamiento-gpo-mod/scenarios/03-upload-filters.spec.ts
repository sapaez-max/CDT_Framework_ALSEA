import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { uploadFiltersCases } from '../data/cases.data';
import { uploadFiltersWorkflow } from '../workflows/upload-filters.workflow';

for (const caseData of uploadFiltersCases) {
  test.describe(
    `@catalogo @menu @administracion @carga-filtros @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      if (caseData.expectedEmailSubject) {
        test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      }
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await uploadFiltersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}

