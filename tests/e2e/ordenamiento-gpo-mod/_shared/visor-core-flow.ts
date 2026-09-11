import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import { excelContentType } from '@src/reporting/email-evidence';
import { copyExcelFromPreviousCase } from '@utils/case-artifact-manager';
import { readCoreViewerExpectation } from '@utils/core-viewer-template';
import type { CoreViewerCase } from './casos.data';
import { goToLanding } from './ordenamiento-flow';

export async function ejecutarValidacionVisorCore(
  page: Page,
  caseData: CoreViewerCase,
  testInfo: TestInfo,
): Promise<void> {
  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const preparedTemplate = await test.step(
    `Copiar plantilla generada por ${caseData.sourceCaseId} para ${caseData.id}`,
    async () => copyExcelFromPreviousCase({
      fromCase: caseData.sourceCaseId,
      toCase: caseData.id,
    }),
  );

  const templateExpectation = await test.step('Leer categoria, item, grupo y modificadores desde la plantilla cargada', async () =>
    readCoreViewerExpectation(preparedTemplate.targetPath));

  testInfo.annotations.push(
    { type: 'Plantilla origen', description: preparedTemplate.sourcePath },
    { type: 'Copia usada por Visor CORE', description: preparedTemplate.targetPath },
    { type: 'Caso origen', description: caseData.sourceCaseId },
    { type: 'Categoria', description: templateExpectation.categoryName },
    { type: 'Item', description: `${templateExpectation.itemId} - ${templateExpectation.itemName}` },
    { type: 'Grupo modificador', description: `${templateExpectation.groupId} - ${templateExpectation.groupName} - Orden ${templateExpectation.groupOrder}` },
    { type: 'Modificadores', description: templateExpectation.modifiers.map(modifier => `${modifier.id} - ${modifier.name} - Orden ${modifier.order}`).join(', ') },
  );

  await testInfo.attach(`expectativa-visor-core-${caseData.id}`, {
    body: Buffer.from(JSON.stringify(templateExpectation, null, 2), 'utf8'),
    contentType: 'application/json',
  });

  await test.step('Abrir Visor CORE y aplicar filtros del caso', async () => {
    const visorCorePage = new CoreViewerPage(page);
    await visorCorePage.open();
    await visorCorePage.applyFilters(caseData);
    try {
      await visorCorePage.validateTemplateExpectation(templateExpectation);
    } catch (error) {
      const diagnostic = await visorCorePage.collectDiagnostic(caseData, templateExpectation);
      await testInfo.attach(`visor-core-grupos-visibles-${caseData.id}`, {
        body: Buffer.from(JSON.stringify(diagnostic, null, 2), 'utf8'),
        contentType: 'application/json',
      });
      await testInfo.attach(`visor-core-screenshot-${caseData.id}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      throw error;
    }
  });

  await test.step('Adjuntar referencia de la plantilla validada en Visor CORE', async () => {
    await expect(preparedTemplate.targetPath, 'La plantilla de referencia debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
    await testInfo.attach(`plantilla-visor-core-${caseData.id}`, {
      path: preparedTemplate.targetPath,
      contentType: excelContentType(preparedTemplate.targetPath),
    });
  });
}
