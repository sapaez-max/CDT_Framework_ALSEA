import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { excelContentType } from '@src/reporting/email-evidence';
import { copyExcelFromPreviousCase } from '@utils/case-artifact-manager';
import type { FilterLoadCase } from './casos.data';
import { attachGmailEvidence, goToLanding } from './ordenamiento-flow';

export async function ejecutarCargaFiltros(
  page: Page,
  caseData: FilterLoadCase,
  testInfo: TestInfo,
  gmailClient?: GmailClient,
): Promise<void> {
  await goToLanding(page);
  await new LoginPage(page).expectAuthenticated();

  const preparedTemplate = await test.step(
    `Copiar plantilla generada por ${caseData.sourceCaseId} para ${caseData.id}`,
    async () => copyExcelFromPreviousCase({
      fromCase: caseData.sourceCaseId,
      toCase: caseData.id,
    }),
  );

  testInfo.annotations.push(
    { type: 'Plantilla origen', description: preparedTemplate.sourcePath },
    { type: 'Copia usada por carga de filtros', description: preparedTemplate.targetPath },
    { type: 'Caso origen', description: caseData.sourceCaseId },
  );

  const menuPage = new MenuAdministrationPage(page);
  await menuPage.openFilterLoad();

  const emailBaseline = caseData.expectedEmailSubject
    ? await test.step('Capturar linea base de Gmail para carga de filtros', async () => {
        if (!gmailClient) {
          throw new Error(`${caseData.id} requiere gmailClient para validar el correo de carga de filtros.`);
        }

        return gmailClient.captureCaseEmailBaseline();
      })
    : undefined;

  await menuPage.loadFilters(caseData, preparedTemplate.targetPath);

  if (caseData.expectedEmailSubject && caseData.expectedEmailBodyFields && emailBaseline && gmailClient) {
    const email = await test.step('Esperar y validar correo nuevo de carga de filtros', async () =>
      gmailClient.waitForCaseEmail(emailBaseline, {
        caseId: caseData.id,
        subject: caseData.expectedEmailSubject!,
        bodyFields: caseData.expectedEmailBodyFields!,
      }));

    await test.step('Adjuntar evidencia Gmail de carga de filtros', async () => {
      await attachGmailEvidence(testInfo, caseData, email);
    });
  }

  await test.step('Adjuntar referencia de la plantilla usada para carga de filtros', async () => {
    await expect(preparedTemplate.targetPath, 'La plantilla cargada debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
    await testInfo.attach(`plantilla-carga-filtros-${caseData.id}`, {
      path: preparedTemplate.targetPath,
      contentType: excelContentType(preparedTemplate.targetPath),
    });
  });
}
