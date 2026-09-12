import type { Page, TestInfo } from '@fixtures/base.fixture';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import type { CoreViewerTemplateExpectation } from '@utils/core-viewer-template';
import { buildCoreViewerComparisonHtml } from '@src/reporting/core-viewer-comparison';
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
    const result = await visor.validateTemplateExpectation(expectation);
    await testInfo.attach('Comparación de datos esperados y obtenidos en Visor CORE', {
      body: Buffer.from(buildCoreViewerComparisonHtml({
        caseId: caseData.id,
        title: caseData.title,
        context: {
          country: caseData.country,
          brand: caseData.brand,
          branch: caseData.branch,
          aggregator: caseData.aggregator,
          menuType: caseData.menuType,
        },
        sourceFile: expectation.inputPath,
        rows: result.rows,
      })),
      contentType: 'text/html',
    });
  } catch (error) {
    try {
      const diagnostic = await visor.collectDiagnostic(caseData, expectation);
      await attachDiagnosticEvidence(testInfo, caseData.id, {
        summary: [
          `Previsualizacion abierta: ${diagnostic.previewVisible ? 'si' : 'no'}`,
          `JSON abierto: ${diagnostic.jsonVisible ? 'si' : 'no'}`,
          `Grupo esperado: ${diagnostic.expectedGroupId} - ${diagnostic.expectedGroupName}`,
          `Grupos encontrados: ${diagnostic.groupsFound.join(', ') || 'ninguno'}`,
        ].join('. '),
        diagnostic,
      });
      if (diagnostic.jsonText) {
        await attachJsonEvidence(testInfo, caseData.id, diagnostic.jsonText);
      }
    } catch (diagnosticError) {
      await attachDiagnosticEvidence(testInfo, caseData.id, {
        summary: `No fue posible completar el diagnostico: ${errorMessage(diagnosticError)}`,
      });
    }

    await testInfo.attach('Captura del Visor CORE al producirse el fallo', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    }).catch(() => undefined);
    throw error;
  }
}

async function attachDiagnosticEvidence(
  testInfo: TestInfo,
  caseId: string,
  diagnostic: object,
): Promise<void> {
  await testInfo.attach('Diagnóstico técnico del Visor CORE', {
    body: Buffer.from(JSON.stringify(diagnostic, null, 2), 'utf8'),
    contentType: 'application/json',
  });
}

async function attachJsonEvidence(testInfo: TestInfo, caseId: string, jsonText: string): Promise<void> {
  await testInfo.attach('JSON obtenido del producto en Visor CORE', {
    body: Buffer.from(jsonText, 'utf8'),
    contentType: 'application/json',
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
