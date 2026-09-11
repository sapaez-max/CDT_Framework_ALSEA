import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { excelContentType } from '@src/reporting/email-evidence';
import type { JsonValidationCase } from '../data/types';
import { ExcelService } from '../services/excel.service';
import {
  annotateExecutionContext,
  annotateSelectedEntities,
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
  annotateExecutionContext(testInfo, context);

  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const excel = new ExcelService();
  const prepared = await test.step(
    `Copiar plantilla validada por ${caseData.sourceCaseId}`,
    () => excel.copyFromCase(caseData.sourceCaseId, caseData.id, artifactScope(context)),
  );
  const expectation = await test.step(
    'Leer item, grupo, modificadores y ordenes esperados',
    () => excel.readViewerExpectation(prepared.targetPath),
  );

  context.files.uploaded = prepared.sourcePath;
  context.product = {
    id: expectation.itemId,
    name: expectation.itemName,
  };
  context.category = { name: expectation.categoryName };
  context.groupModifier = {
    id: expectation.groupId,
    nameAfter: expectation.groupName,
    descriptionAfter: expectation.groupDescription,
  };
  context.modifiers = expectation.modifiers.map(modifier => ({
    id: modifier.id,
    nameAfter: modifier.name,
  }));

  testInfo.annotations.push(
    { type: 'Plantilla origen', description: prepared.sourcePath },
    { type: 'Categoria', description: expectation.categoryName },
    { type: 'Orden del grupo', description: String(expectation.groupOrder) },
    {
      type: 'Orden de modificadores',
      description: expectation.modifiers.map(item => `${item.id}: ${item.order}`).join(', '),
    },
  );
  annotateSelectedEntities(testInfo, context);

  await test.step('Validar JSON publicado del menu', () =>
    validatePublishedMenuJson(page, caseData, expectation, testInfo));

  expect(prepared.targetPath, 'La plantilla usada como referencia debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  await testInfo.attach(`plantilla-json-${caseData.id}`, {
    path: prepared.targetPath,
    contentType: excelContentType(prepared.targetPath),
  });

  return context;
}
