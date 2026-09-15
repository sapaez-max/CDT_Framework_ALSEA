import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import type { CoreViewerCase } from '../data/cases.data';
import { ExcelService } from '../services/excel.service';
import {
  annotateExecutionContext,
  annotateItemAndCategory,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import { goToLanding } from '../support/navigation';
import { validateCoreViewer } from '../validators/core-viewer.validator';

export async function validateVisorWorkflow(
  page: Page,
  caseData: CoreViewerCase,
  testInfo: TestInfo,
  sourceContext?: ExecutionContext,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context, caseData);
  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const excel = new ExcelService();
  const prepared = await test.step(
    `Referenciar plantilla generada por ${caseData.sourceCaseId}`,
    () => excel.referenceForCase(caseData.id, caseData.sourceCaseId, artifactScope(context)),
  );
  const expectation = await test.step(
    'Leer item, grupo y modificadores que deben validarse',
    () => excel.readViewerExpectation(prepared.sourcePath),
  );

  context.files.uploaded = prepared.sourcePath;
  context.product = {
    id: expectation.itemId,
    name: expectation.itemName,
  };
  context.category = sourceContext?.category ?? { name: expectation.categoryName };
  context.groupModifier = sourceContext?.groupModifier ?? {
    id: expectation.groupId,
    nameAfter: expectation.groupName,
    descriptionAfter: expectation.groupDescription,
  };
  context.modifiers = sourceContext?.modifiers ?? expectation.modifiers.map(modifier => ({
    id: modifier.id,
    nameAfter: modifier.name,
  }));
  annotateItemAndCategory(testInfo, context);

  await test.step('Validar en Visor CORE los datos de la plantilla', () =>
    validateCoreViewer(page, caseData, expectation, testInfo));

  expect(prepared.sourcePath, 'La plantilla validada debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  await testInfo.attach(buildExcelAttachmentName('Plantilla esperada para validación en Visor CORE', prepared.sourcePath), {
    path: prepared.sourcePath,
    contentType: excelContentType(prepared.sourcePath),
  });
  return context;
}
