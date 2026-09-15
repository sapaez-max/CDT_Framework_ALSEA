import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import type { JsonValidationCase } from '../data/cases.data';
import { ExcelService } from '../services/excel.service';
import {
  annotateExecutionContext,
  annotateItemAndCategory,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import { goToLanding } from '../support/navigation';
import { validatePublishedMenuJson } from '../validators/json-menu.validator';

export async function validateJsonWorkflow(
  page: Page,
  caseData: JsonValidationCase,
  testInfo: TestInfo,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context, caseData);

  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const excel = new ExcelService();
  const prepared = await test.step(
    `Referenciar plantilla validada por ${caseData.sourceCaseId}`,
    () => excel.referenceForCase(caseData.id, caseData.sourceCaseId, artifactScope(context)),
  );
  const expectation = await test.step(
    'Leer item, grupo, modificadores y ordenes esperados',
    () => excel.readViewerExpectation(prepared.sourcePath),
  );

  context.files.uploaded = prepared.sourcePath;
  context.product = {
    id: expectation.itemId,
    name: expectation.itemName,
  };
  context.category = { name: expectation.categoryName };
  context.groupModifier = {
    id: expectation.resolvedGroupId,
    nameAfter: expectation.resolvedGroupName,
    descriptionAfter: expectation.groupDescription,
  };
  context.modifiers = expectation.modifiers.map(modifier => ({
    id: modifier.id,
    nameAfter: modifier.name,
  }));

  annotateItemAndCategory(testInfo, context);

  await test.step('Validar JSON publicado del menu', () =>
    validatePublishedMenuJson(page, caseData, expectation, testInfo));

  expect(prepared.sourcePath, 'La plantilla usada como referencia debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  await testInfo.attach(buildExcelAttachmentName('Plantilla utilizada para validar el JSON', prepared.sourcePath), {
    path: prepared.sourcePath,
    contentType: excelContentType(prepared.sourcePath),
  });

  return context;
}
