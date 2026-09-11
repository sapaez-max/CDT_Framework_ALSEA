import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderGroupsAndModifiersCases } from '../data/cases.data';
import { reorderGroupsAndModifiersWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderGroupsAndModifiersCases) {
  test.describe(
    `@catalogo @menu @reorden-grupos-modificadores @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await reorderGroupsAndModifiersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
