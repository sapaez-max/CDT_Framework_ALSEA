import { env } from '@config/env';
import { test } from '@fixtures/base.fixture';
import { multipleGroupsCases } from '../data/cases.data';
import { multipleGroupsWorkflow } from '../workflows/update-existing-menu.workflow';

for (const caseData of multipleGroupsCases) {
  test.describe(
    caseData.datasetId,
    { tag: ['@ordenamiento-gpo-mod', '@multiples-grupos', `@${caseData.id}`, caseData.brandTag] },
    () => {
      test.describe.configure({ timeout: env.gmail.pollTimeoutMs * 2 + env.visorPropagationTimeoutMs + 240_000 });
      test(`${caseData.id} - ${caseData.title}`, async ({ page, gmailClient }, testInfo) => {
        await multipleGroupsWorkflow(page, caseData, testInfo, gmailClient);
      });
    },
  );
}
