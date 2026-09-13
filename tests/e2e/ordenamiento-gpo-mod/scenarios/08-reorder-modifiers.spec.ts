import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderModifiersCases } from '../data/cases.data';
import { reorderModifiersWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderModifiersCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@reorden-modificadores', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await reorderModifiersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
