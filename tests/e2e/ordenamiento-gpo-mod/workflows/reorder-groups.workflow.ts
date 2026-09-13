import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildModificationEvidenceHtml } from '@src/reporting/modification-evidence';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import type { ReorderGroupsAndModifiersCase, ReorderGroupsCase, ReorderModifiersCase } from '../data/types';
import { ExcelService } from '../services/excel.service';
import { GmailService } from '../services/gmail.service';
import { attachGmailEvidence } from '../support/email-report';
import {
  annotateExecutionContext,
  annotateItemAndCategory,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import {
  appendMenuLoadValidations,
  appendMenuPortalValidation,
  evaluateMenuLoadEmail,
  throwIfMenuLoadFailed,
} from '../support/menu-load-email-result';
import { goToLanding } from '../support/navigation';

export async function reorderGroupsWorkflow(
  page: Page,
  caseData: ReorderGroupsCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
): Promise<ExecutionContext> {
  return reorderWorkflow(page, caseData, testInfo, gmailClient, {
    editStep: `Copiar plantilla generada por ${caseData.sourceCaseId} y reordenar grupos`,
    edit: (excel, context) =>
      excel.reorderGroups(caseData.id, caseData.sourceCaseId, normalizeAggregatorColumn(caseData.aggregator), artifactScope(context)),
  });
}

export async function reorderModifiersWorkflow(
  page: Page,
  caseData: ReorderModifiersCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
): Promise<ExecutionContext> {
  return reorderWorkflow(page, caseData, testInfo, gmailClient, {
    editStep: `Copiar plantilla generada por ${caseData.sourceCaseId} y reordenar modificadores`,
    edit: (excel, context) =>
      excel.reorderModifiers(caseData.id, caseData.sourceCaseId, normalizeAggregatorColumn(caseData.aggregator), artifactScope(context)),
  });
}

export async function reorderGroupsAndModifiersWorkflow(
  page: Page,
  caseData: ReorderGroupsAndModifiersCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
): Promise<ExecutionContext> {
  return reorderWorkflow(page, caseData, testInfo, gmailClient, {
    editStep: `Copiar plantilla generada por ${caseData.sourceCaseId} y reordenar grupos y modificadores`,
    edit: (excel, context) =>
      excel.reorderGroupsAndModifiers(caseData.id, caseData.sourceCaseId, normalizeAggregatorColumn(caseData.aggregator), artifactScope(context)),
  });
}

async function reorderWorkflow(
  page: Page,
  caseData: ReorderGroupsCase | ReorderModifiersCase | ReorderGroupsAndModifiersCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
  options: {
    editStep: string;
    edit: (excel: ExcelService, context: ExecutionContext) => ReturnType<ExcelService['reorderGroups']>;
  },
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context, caseData);

  const excel = new ExcelService();
  const edited = await test.step(
    options.editStep,
    () => options.edit(excel, context),
  );
  const { expectation } = edited;
  context.files.edited = edited.outputPath;
  context.files.uploaded = edited.outputPath;
  context.product = {
    id: expectation.itemId,
    name: expectation.itemName,
  };
  context.category = { name: expectation.categoryName };
  context.groupModifier = {
    id: expectation.groups.map(group => group.id).join(', '),
    nameAfter: expectation.groups.map(group => `${group.name}: ${group.previousOrder} -> ${group.expectedOrder}`).join(' | '),
  };
  context.modifiers = expectation.groups.flatMap(group => group.modifiers.map(modifier => ({
    id: modifier.id,
    nameAfter: modifier.name,
  })));
  annotateItemAndCategory(testInfo, context);

  await testInfo.attach('Resumen comparativo de cambios en Excel', {
    body: Buffer.from(buildModificationEvidenceHtml({
      caseId: caseData.id,
      title: caseData.title,
      context: {
        country: context.country,
        brand: context.brand,
        branch: context.branch,
        aggregator: context.aggregator,
        menuType: context.menuType,
      },
      sourceFile: edited.sourcePath,
      resultFile: edited.outputPath,
      item: context.product,
      category: context.category?.name,
      modifierGroups: edited.changes
        .filter(change => change.entityType === 'modifierGroup')
        .map(change => ({
          id: change.entityId,
          name: change.entityName,
          orderBefore: change.previousValue,
          orderAfter: change.newValue,
        })),
      modifiers: edited.changes
        .filter(change => change.entityType === 'modifier')
        .map(change => ({
          id: change.entityId,
          name: change.entityName,
          orderBefore: change.previousValue,
          orderAfter: change.newValue,
        })),
    })),
    contentType: 'text/html',
  });

  await testInfo.attach(buildExcelAttachmentName('Plantilla Excel reordenada', edited.outputPath), {
    path: edited.outputPath,
    contentType: excelContentType(edited.outputPath),
  });

  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const menuPage = new MenuAdministrationPage(page);
  const gmail = new GmailService(gmailClient);

  await test.step('Cargar filtros con plantilla reordenada', async () => {
    await menuPage.openFilterLoad();
    const baseline = caseData.expectedFilterEmailSubject
      ? await gmail.captureCaseBaseline()
      : undefined;
    await menuPage.loadFilters({
      country: caseData.country,
      brand: caseData.brand,
      aggregator: caseData.aggregator,
      menuType: caseData.menuType,
      loadType: caseData.loadType,
      versionMenu: caseData.versionMenu,
      description: caseData.filterDescription,
      expectedMessage: caseData.expectedFilterMessage,
    }, edited.outputPath);

    if (baseline && caseData.expectedFilterEmailSubject && caseData.expectedFilterEmailBodyFields) {
      const email = await gmail.waitForCase(baseline, {
        caseId: caseData.id,
        subject: caseData.expectedFilterEmailSubject,
        bodyFields: caseData.expectedFilterEmailBodyFields,
        artifactScope: artifactScope(context),
      });
      await attachGmailEvidence(testInfo, caseData, email, 'filter-load');
    }
  });

  await test.step('Cargar menu con los filtros reordenados', async () => {
    await menuPage.openMenuLoad();
    const baseline = await gmail.captureCaseBaseline();
    const portalResult = await menuPage.loadMenu({
      country: caseData.country,
      brand: caseData.brand,
      branch: caseData.branch,
      aggregator: caseData.aggregator,
      menuType: caseData.menuType,
      description: caseData.menuDescription,
      expectedMessage: caseData.expectedMenuMessage,
    });

    const email = await gmail.waitForCase(baseline, {
      caseId: caseData.id,
      subject: caseData.expectedMenuEmailSubject,
      bodyFields: caseData.expectedMenuEmailBodyFields,
      artifactScope: artifactScope(context),
    });
    const loadResult = evaluateMenuLoadEmail(email);
    appendMenuPortalValidation(email, portalResult);
    appendMenuLoadValidations(email, loadResult);
    await attachGmailEvidence(testInfo, caseData, email, 'menu-load');
    throwIfMenuLoadFailed(loadResult);
  });

  await test.step('Validar en Visor CORE el orden de grupos modificadores', async () => {
    const visor = new CoreViewerPage(page);
    await visor.open();
    await visor.applyFilters(caseData);
    await visor.validateReorderedGroups(expectation);
  });

  expect(edited.outputPath, 'La plantilla reordenada debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  return context;
}

function normalizeAggregatorColumn(value: string | string[]): string {
  const text = Array.isArray(value) ? value[0] : value;
  return text.replace(/\s+/g, '');
}
