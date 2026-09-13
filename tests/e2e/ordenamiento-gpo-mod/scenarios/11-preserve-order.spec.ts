import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { preserveOrderCases } from '../data/cases.data';
import { preserveOrderWorkflow } from '../workflows/update-existing-menu.workflow';

for (const caseData of preserveOrderCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@conservar-orden', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + env.visorPropagationTimeoutMs + 240_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await preserveOrderWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
