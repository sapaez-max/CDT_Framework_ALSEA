import type { Page, TestInfo } from '@fixtures/base.fixture';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import type {
  CoreViewerCase,
  FilterLoadCase,
  MenuLoadCase,
  TemplateDownloadCase,
  TemplateEditCase,
} from '../data/types';
import { downloadTemplateWorkflow } from './download-template.workflow';
import { editTemplateWorkflow } from './edit-template.workflow';
import { uploadFiltersWorkflow } from './upload-filters.workflow';
import { uploadMenuWorkflow } from './upload-menu.workflow';
import { validateVisorWorkflow } from './validate-visor.workflow';

export type MenuGoldenPathCases = {
  download: TemplateDownloadCase;
  edit: TemplateEditCase;
  filters: FilterLoadCase;
  menu: MenuLoadCase;
  visor: CoreViewerCase;
};

export async function menuGoldenPathWorkflow(
  page: Page,
  gmailClient: GmailClient,
  testInfo: TestInfo,
  cases: MenuGoldenPathCases,
): Promise<void> {
  assertSameDataset(cases);
  await downloadTemplateWorkflow(page, gmailClient, testInfo, cases.download);
  const editContext = await editTemplateWorkflow(cases.edit, testInfo);
  await uploadFiltersWorkflow(page, cases.filters, testInfo, gmailClient);
  await uploadMenuWorkflow(page, cases.menu, testInfo, gmailClient);
  await validateVisorWorkflow(page, cases.visor, testInfo, editContext);
}

function assertSameDataset(cases: MenuGoldenPathCases): void {
  const datasetIds = new Set(Object.values(cases).map(caseData => caseData.datasetId));
  if (datasetIds.size !== 1) {
    throw new Error(`El Golden Path debe usar un unico juego de datos: ${[...datasetIds].join(', ')}.`);
  }
}

