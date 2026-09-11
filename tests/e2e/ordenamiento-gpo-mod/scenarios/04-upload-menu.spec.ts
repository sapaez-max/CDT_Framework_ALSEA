import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { uploadMenuCases } from '../data/cases.data';
import { uploadMenuWorkflow } from '../workflows/upload-menu.workflow';

for (const caseData of uploadMenuCases) {
  test.describe(
    `@catalogo @menu @administracion @carga-menu @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await uploadMenuWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}

