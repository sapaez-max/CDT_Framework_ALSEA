import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderGroupsCases } from '../data/cases.data';
import { reorderGroupsWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderGroupsCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@reorden-grupos', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await reorderGroupsWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
