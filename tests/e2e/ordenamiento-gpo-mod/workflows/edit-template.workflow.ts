import { fileTest as test, type TestInfo } from '@fixtures/base.fixture';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import { buildModificationEvidenceHtml } from '@src/reporting/modification-evidence';
import type { TemplateEditCase } from '../data/cases.data';
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
  annotateExecutionContext(testInfo, context, caseData);
  const excel = new ExcelService();

  await test.step('Copiar la plantilla del escenario anterior', async () => {
    await test.step(`Localizar la plantilla de ${caseData.sourceCaseId} y editar una copia`, async () => {});
  });

  const result = await test.step('Seleccionar item, grupo y modificadores relacionados', () =>
    excel.editTemplate(
      caseData.id,
      caseData.sourceCaseId,
      caseData.aggregator,
      artifactScope(context),
    ),
  );

  await test.step('Modificar nombres de item, grupo y modificadores', async () => {
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
  });

  await test.step('Guardar y validar la plantilla editada', async () => {
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
          nameBefore: result.changes.find(c => c.sheet === 'Items' && c.field === 'Nombre Comercial')?.previousValue,
          nameAfter: result.changes.find(c => c.sheet === 'Items' && c.field === 'Nombre Comercial')?.newValue,
        },
        category: context.category?.name,
        modifierGroups: [{
          id: result.resolvedGroupId,
          nameBefore: result.changes.find(c => c.sheet === 'GrupoModificador' && c.field === 'Nombre Comercial')?.previousValue,
          nameAfter: result.changes.find(c => c.sheet === 'GrupoModificador' && c.field === 'Nombre Comercial')?.newValue,
          descriptionBefore: result.changes.find(c => c.sheet === 'GrupoModificador' && c.field === 'Descripcion')?.previousValue,
          descriptionAfter: result.changes.find(c => c.sheet === 'GrupoModificador' && c.field === 'Descripcion')?.newValue,
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
  });

  return context;
}
