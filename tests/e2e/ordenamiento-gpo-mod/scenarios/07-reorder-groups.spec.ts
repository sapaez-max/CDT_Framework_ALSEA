import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { reorderGroupsCases } from '../data/cases.data';
import { reorderGroupsWorkflow } from '../workflows/reorder-groups.workflow';

for (const caseData of reorderGroupsCases) {
  test.describe(
    `@catalogo @menu @reorden-grupos @ordenamiento-gpo-mod @${caseData.id}`,
    { tag: caseData.brandTag },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + 180_000 });
      test(`@${caseData.id} ${caseData.id} - ${caseData.title} - ${caseData.datasetId}`, async ({ page, gmailClient }, testInfo) => {
        await reorderGroupsWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
