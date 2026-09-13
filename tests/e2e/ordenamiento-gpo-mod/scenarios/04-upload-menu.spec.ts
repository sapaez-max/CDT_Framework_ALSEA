import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { uploadMenuCases } from '../data/cases.data';
import { uploadMenuWorkflow } from '../workflows/upload-menu.workflow';

for (const caseData of uploadMenuCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@carga-menu', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await uploadMenuWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}

