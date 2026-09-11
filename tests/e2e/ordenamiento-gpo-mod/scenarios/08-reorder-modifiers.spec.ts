import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderModifiersCases } from '../data/cases.data';
import { reorderModifiersWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderModifiersCases) {
  test.describe(
    `@catalogo @menu @reorden-modificadores @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await reorderModifiersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
