import { fileTest as test, type TestInfo } from '@fixtures/base.fixture';
import { excelContentType } from '@src/reporting/email-evidence';
import type { TemplateEditCase } from '../data/types';
import { ExcelService } from '../services/excel.service';
import {
  annotateExecutionContext,
  annotateSelectedEntities,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';

export async function editTemplateWorkflow(
  caseData: TemplateEditCase,
  testInfo: TestInfo,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context);
  const excel = new ExcelService();
  const result = await test.step(
    `Localizar la plantilla de ${caseData.sourceCaseId} y editar una copia`,
    () => excel.editTemplate(
      caseData.id,
      caseData.sourceCaseId,
      caseData.aggregator,
      artifactScope(context),
    ),
  );

  context.files.downloaded = result.sourcePath;
  context.files.edited = result.outputPath;
  context.product = { id: result.itemId, name: result.itemName };
  context.category = { name: result.categoryName };
  const groupName = result.changes.find(change =>
    change.sheet === 'GrupoModificador' && change.field === 'Nombre Comercial');
  const groupDescription = result.changes.find(change =>
    change.sheet === 'GrupoModificador' && change.field === 'Descripcion');
  context.groupModifier = {
    id: result.groupId,
    nameBefore: groupName?.previousValue,
    nameAfter: groupName?.newValue,
    descriptionBefore: groupDescription?.previousValue,
    descriptionAfter: groupDescription?.newValue,
  };
  context.modifiers = result.modifierIds.map((id, index) => {
    const change = result.changes.filter(candidate =>
      candidate.field === 'Nombre Comercial Modificador')[index];
    return {
      id,
      nameBefore: change?.previousValue,
      nameAfter: change?.newValue,
    };
  });

  testInfo.annotations.push(
    { type: 'Plantilla origen', description: result.sourcePath },
    { type: 'Plantilla editada', description: result.outputPath },
    { type: 'Agregador habilitado', description: caseData.aggregator },
  );
  annotateSelectedEntities(testInfo, context);
  for (const change of result.changes) {
    testInfo.annotations.push({
      type: `${change.sheet}!${change.cell}`,
      description: `${change.field}: "${change.previousValue}" -> "${change.newValue}"`,
    });
  }

  await testInfo.attach(`plantilla-editada-${caseData.id}`, {
    path: result.outputPath,
    contentType: excelContentType(result.outputPath),
  });
  return context;
}
