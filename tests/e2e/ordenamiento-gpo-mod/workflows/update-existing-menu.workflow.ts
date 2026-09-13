import { env } from '@config/env';
import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import { excelContentType } from '@src/reporting/email-evidence';
import {
  buildMenuUpdateEvidenceHtml,
  buildTechnicalMenuJsonComparison,
} from '@src/reporting/menu-update-evidence';
import { buildModificationEvidenceHtml } from '@src/reporting/modification-evidence';
import { formatExecutionTimestamp } from '@src/utils/execution-timestamp';
import {
  buildExpectedMenuSnapshot,
  compareMenuSnapshots,
  parseMenuSnapshot,
  type MenuSnapshot,
  type MenuSnapshotComparison,
} from '@src/utils/menu-update-snapshot';
import type { UpdateExistingMenuCase } from '../data/types';
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

export async function updateExistingMenuWorkflow(
  page: Page,
  caseData: UpdateExistingMenuCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  const executionTimestamp = formatExecutionTimestamp();
  const executionIdentifier = `AUTO_${caseData.id}_${executionTimestamp}`;
  annotateExecutionContext(testInfo, context, {
    ...caseData,
    filterDescription: `${caseData.filterDescription} ${executionIdentifier}`,
    menuDescription: `${caseData.menuDescription} ${executionIdentifier}`,
  });

  const excel = new ExcelService();
  const aggregatorColumn = normalizeAggregatorColumn(caseData.aggregator);
  const sourceState = await test.step(
    'Identificar la plantilla del menu existente sin modificarla',
    () => excel.inspectExistingMenu(
      caseData.id,
      caseData.sourceCaseId,
      aggregatorColumn,
      artifactScope(context),
    ),
  );
  context.product = {
    id: sourceState.expectation.itemId,
    name: sourceState.expectation.itemName,
  };
  context.category = { name: sourceState.expectation.categoryName };
  annotateItemAndCategory(testInfo, context);

  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const visor = new CoreViewerPage(page);
  const beforeJson = await test.step('Capturar y validar el estado inicial del menu en Visor CORE', async () => {
    await visor.open();
    await visor.applyFilters(caseData);
    await visor.validateReorderedGroups(sourceState.expectation, { validateDuplicates: true });
    return visor.openCurrentProductJson();
  });
  const baselineSnapshot = parseMenuSnapshot(beforeJson);

  const edited = await test.step(
    'Crear una copia y modificar selectivamente el menu existente',
    () => excel.updateExistingMenu(
      caseData.id,
      caseData.sourceCaseId,
      aggregatorColumn,
      artifactScope(context),
    ),
  );
  const { expectation } = edited;
  expect(expectation.itemId, 'La copia editada debe corresponder al item del baseline').toBe(sourceState.expectation.itemId);
  expect(expectation.categoryName, 'La copia editada debe conservar la categoria del baseline')
    .toBe(sourceState.expectation.categoryName);
  context.files.edited = edited.outputPath;
  context.files.uploaded = edited.outputPath;
  context.product = { id: expectation.itemId, name: expectation.itemName };
  context.category = { name: expectation.categoryName };
  context.groupModifier = {
    id: expectation.groups.map(group => group.id).join(', '),
    nameAfter: expectation.groups
      .map(group => `${group.name}: ${group.previousOrder} -> ${group.expectedOrder}`)
      .join(' | '),
  };
  context.modifiers = expectation.groups.flatMap(group => group.modifiers.map(modifier => ({
    id: modifier.id,
    nameAfter: modifier.name,
  })));
  

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
      category: context.category.name,
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
  await testInfo.attach(buildExcelAttachmentName('Plantilla Excel original del menú', edited.sourcePath), {
    path: edited.sourcePath,
    contentType: excelContentType(edited.sourcePath),
  });
  await testInfo.attach(buildExcelAttachmentName('Plantilla Excel actualizada', edited.outputPath), {
    path: edited.outputPath,
    contentType: excelContentType(edited.outputPath),
  });

  const expectedSnapshot = buildExpectedMenuSnapshot(baselineSnapshot, edited.changes);

  await goToLanding(page);
  await new LoginPage(page).expectAuthenticated();

  const menuPage = new MenuAdministrationPage(page);
  const gmail = new GmailService(gmailClient);

  await test.step('Actualizar filtros del menu existente', async () => {
    await menuPage.openFilterLoad();
    const baseline = await gmail.captureCaseBaseline();
    await menuPage.loadFilters({
      country: caseData.country,
      brand: caseData.brand,
      aggregator: caseData.aggregator,
      menuType: caseData.menuType,
      loadType: caseData.loadType,
      versionMenu: caseData.versionMenu,
      description: `${caseData.filterDescription} ${executionIdentifier}`,
      expectedMessage: caseData.expectedFilterMessage,
    }, edited.outputPath);

    if (!caseData.expectedFilterEmailSubject || !caseData.expectedFilterEmailBodyFields) {
      throw new Error(`${caseData.id} requiere la configuracion del correo de carga de filtros.`);
    }
    const email = await gmail.waitForCase(baseline, {
      caseId: caseData.id,
      subject: caseData.expectedFilterEmailSubject,
      bodyFields: caseData.expectedFilterEmailBodyFields,
      artifactScope: artifactScope(context),
    });
    await attachGmailEvidence(testInfo, caseData, email, 'filter-load');
  });

  await test.step('Publicar la actualizacion del menu existente', async () => {
    await menuPage.openMenuLoad();
    const baseline = await gmail.captureCaseBaseline();
    const portalResult = await menuPage.loadMenu({
      country: caseData.country,
      brand: caseData.brand,
      branch: caseData.branch,
      aggregator: caseData.aggregator,
      menuType: caseData.menuType,
      description: `${caseData.menuDescription} ${executionIdentifier}`,
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

  let afterJson = '';
  let actualSnapshot: MenuSnapshot | undefined;
  let semanticComparison: MenuSnapshotComparison | undefined;
  let propagationError: unknown;

  await test.step('Esperar y validar la propagacion del menu actualizado en Visor CORE', async () => {
    try {
      await expect(async () => {
        await goToLanding(page);
        await new LoginPage(page).expectAuthenticated();
        await visor.open();
        await visor.applyFilters(caseData);
        await visor.validateReorderedGroups(expectation, { validateDuplicates: true });
        const candidateJson = await visor.openCurrentProductJson();
        const candidateSnapshot = parseMenuSnapshot(candidateJson);
        const candidateComparison = compareMenuSnapshots(
          baselineSnapshot,
          expectedSnapshot,
          candidateSnapshot,
          edited.changes,
        );

        afterJson = candidateJson;
        actualSnapshot = candidateSnapshot;
        semanticComparison = candidateComparison;
        expect(
          candidateComparison.failures,
          'El Visor CORE aun no refleja exclusivamente los cambios esperados',
        ).toEqual([]);
      }).toPass({
        timeout: env.visorPropagationTimeoutMs,
        intervals: [2_000, 5_000, 10_000, 20_000],
      });
    } catch (error) {
      propagationError = error;
    }
  });

  if (!actualSnapshot || !semanticComparison) {
    throw propagationError ?? new Error('No se pudo capturar el estado final del menu en Visor CORE.');
  }

  const evidence = {
    caseId: caseData.id,
    title: caseData.title,
    executionTimestamp,
    context: {
      country: context.country,
      brand: context.brand,
      branch: context.branch,
      aggregator: context.aggregator,
      menuType: context.menuType,
    },
    item: { id: expectation.itemId, name: expectation.itemName },
    category: expectation.categoryName,
    sourceFile: edited.sourcePath,
    resultFile: edited.outputPath,
    changes: edited.changes,
    beforeJson,
    afterJson,
    baselineSnapshot,
    expectedSnapshot,
    actualSnapshot,
    semanticComparison,
  };
  await testInfo.attach('Comparación del menú antes y después de la actualización', {
    body: Buffer.from(buildMenuUpdateEvidenceHtml(evidence), 'utf8'),
    contentType: 'text/html',
  });
  await testInfo.attach('Comparación técnica del JSON del menú', {
    body: Buffer.from(buildTechnicalMenuJsonComparison(evidence), 'utf8'),
    contentType: 'application/json',
  });

  expect(
    semanticComparison.failures,
    'El estado final del menu debe coincidir con el estado esperado sin cambios colaterales',
  ).toEqual([]);
  if (propagationError) throw propagationError;

  expect(edited.outputPath, 'La plantilla actualizada debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  return context;
}

function normalizeAggregatorColumn(value: string | string[]): string {
  return firstValue(value).replace(/\s+/g, '');
}

function firstValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
