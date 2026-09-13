import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { downloadTemplateCases } from '../data/cases.data';
import { downloadTemplateWorkflow } from '../workflows/download-template.workflow';

for (const caseData of downloadTemplateCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@descarga-plantilla', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await downloadTemplateWorkflow(page, gmailClient, testInfo, caseData);
      });
    },
  );
}

