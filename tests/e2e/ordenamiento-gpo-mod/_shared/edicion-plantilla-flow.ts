import { fileTest as test, type TestInfo } from '@fixtures/base.fixture';
import { excelContentType } from '@src/reporting/email-evidence';
import { editDownloadedTemplate } from '@utils/template-editor';
import type { TemplateEditCase } from './casos.data';

export async function ejecutarEdicionPlantilla(
  caseData: TemplateEditCase,
  testInfo: TestInfo,
): Promise<void> {
  const result = await test.step(
    `Localizar la plantilla descargada por ${caseData.sourceCaseId}, validar sus datos y editar una copia`,
    async () => editDownloadedTemplate({
      caseId: caseData.id,
      sourceCaseId: caseData.sourceCaseId,
      aggregators: caseData.aggregators,
    }),
  );

  testInfo.annotations.push(
    { type: 'Plantilla origen', description: result.sourcePath },
    { type: 'Copia de trabajo', description: result.inputPath },
    { type: 'Plantilla resultado', description: result.outputPath },
    { type: 'Producto', description: result.itemId },
    { type: 'Grupo modificador', description: result.groupId },
    { type: 'Modificadores', description: result.modifierIds.join(', ') },
    { type: 'Agregador', description: result.aggregator },
  );

  for (const change of result.changes) {
    testInfo.annotations.push({
      type: `${change.sheet}!${change.cell}`,
      description: `${change.field}: "${change.previousValue}" -> "${change.newValue}"`,
    });
  }

  await test.step('Comprobar que la copia conserva las hojas y los cambios realizados', async () => {
    await testInfo.attach(`plantilla-editada-${caseData.id}`, {
      path: result.outputPath,
      contentType: excelContentType(result.outputPath),
    });
  });
}
