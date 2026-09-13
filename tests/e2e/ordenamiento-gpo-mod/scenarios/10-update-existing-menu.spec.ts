import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { updateExistingMenuCases } from '../data/cases.data';
import { updateExistingMenuWorkflow } from '../workflows/update-existing-menu.workflow';

for (const caseData of updateExistingMenuCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@actualizar-menu', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + env.visorPropagationTimeoutMs + 240_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await updateExistingMenuWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
