import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderGroupsAndModifiersCases } from '../data/cases.data';
import { reorderGroupsAndModifiersWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderGroupsAndModifiersCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@reorden-grupos-modificadores', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await reorderGroupsAndModifiersWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
