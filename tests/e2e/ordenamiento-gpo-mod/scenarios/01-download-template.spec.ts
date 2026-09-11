import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { downloadTemplateCases } from '../data/cases.data';
import { downloadTemplateWorkflow } from '../workflows/download-template.workflow';

for (const caseData of downloadTemplateCases) {
  test.describe(
    `@catalogo @menu @administracion @descarga-plantilla @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs + 120_000 });
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await downloadTemplateWorkflow(page, gmailClient, testInfo, caseData);
      });
    },
  );
}

