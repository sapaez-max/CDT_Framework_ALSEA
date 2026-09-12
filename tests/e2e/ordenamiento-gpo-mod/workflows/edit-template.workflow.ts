import { fileTest as test, type TestInfo } from '@fixtures/base.fixture';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import { buildModificationEvidenceHtml } from '@src/reporting/modification-evidence';
import type { TemplateEditCase } from '../data/types';
import { ExcelService } from '../services/excel.service';
import {
  annotateExecutionContext,
  annotateItemAndCategory,
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
  const itemName = result.changes.find(change =>
    change.sheet === 'Items' && change.field === 'Nombre Comercial');
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
      sourceFile: result.sourcePath,
      resultFile: result.outputPath,
      item: {
        id: result.itemId,
        nameBefore: itemName?.previousValue,
        nameAfter: itemName?.newValue,
      },
      category: context.category?.name,
      modifierGroups: [{
        id: result.groupId,
        nameBefore: groupName?.previousValue,
        nameAfter: groupName?.newValue,
        descriptionBefore: groupDescription?.previousValue,
        descriptionAfter: groupDescription?.newValue,
      }],
      modifiers: context.modifiers.map(modifier => ({
        id: modifier.id,
        nameBefore: modifier.nameBefore,
        nameAfter: modifier.nameAfter,
      })),
    })),
    contentType: 'text/html',
  });

  await testInfo.attach(buildExcelAttachmentName('Plantilla Excel editada', result.outputPath), {
    path: result.outputPath,
    contentType: excelContentType(result.outputPath),
  });
  return context;
}
