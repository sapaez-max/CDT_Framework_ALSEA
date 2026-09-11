import type { Page, TestInfo } from '@fixtures/base.fixture';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import type { CoreViewerTemplateExpectation } from '@utils/core-viewer-template';
import type { CoreViewerCase } from '../data/types';

export async function validateCoreViewer(
  page: Page,
  caseData: CoreViewerCase,
  expectation: CoreViewerTemplateExpectation,
  testInfo: TestInfo,
): Promise<void> {
  const visor = new CoreViewerPage(page);
  await visor.open();
  await visor.applyFilters(caseData);

  try {
    const jsonText = await visor.validateTemplateExpectation(expectation);
    await attachJsonEvidence(testInfo, caseData.id, jsonText);
  } catch (error) {
    try {
      const diagnostic = await visor.collectDiagnostic(caseData, expectation);
      testInfo.annotations.push({
        type: 'Diagnostico Visor CORE',
        description: [
          `Previsualizacion abierta: ${diagnostic.previewVisible ? 'si' : 'no'}`,
          `JSON abierto: ${diagnostic.jsonVisible ? 'si' : 'no'}`,
          `Grupo esperado: ${diagnostic.expectedGroupId} - ${diagnostic.expectedGroupName}`,
          `Grupos encontrados: ${diagnostic.groupsFound.join(', ') || 'ninguno'}`,
        ].join('. '),
      });
      if (diagnostic.jsonText) {
        await attachJsonEvidence(testInfo, caseData.id, diagnostic.jsonText);
      }
    } catch (diagnosticError) {
      testInfo.annotations.push({
        type: 'Diagnostico Visor CORE',
        description: `No fue posible completar el diagnostico: ${errorMessage(diagnosticError)}`,
      });
    }

    await testInfo.attach(`visor-core-screenshot-${caseData.id}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    }).catch(() => undefined);
    throw error;
  }
}

async function attachJsonEvidence(testInfo: TestInfo, caseId: string, jsonText: string): Promise<void> {
  await testInfo.attach(`visor-core-json-${caseId}`, {
    body: Buffer.from(jsonText, 'utf8'),
    contentType: 'application/json',
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
