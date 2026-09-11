import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { excelContentType } from '@src/reporting/email-evidence';
import { copyExcelFromPreviousCase } from '@utils/case-artifact-manager';
import type { MenuLoadCase } from './casos.data';
import { attachGmailEvidence, goToLanding } from './ordenamiento-flow';

export async function ejecutarCargaMenu(
  page: Page,
  caseData: MenuLoadCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
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
    { type: 'Copia de referencia para carga de menu', description: preparedTemplate.targetPath },
    { type: 'Caso origen', description: caseData.sourceCaseId },
  );

  const menuPage = new MenuAdministrationPage(page);
  await menuPage.openMenuLoad();

  const emailBaseline = await test.step(
    'Capturar linea base de Gmail para carga de menu',
    async () => gmailClient.captureCaseEmailBaseline(),
  );

  const portalResult = await menuPage.loadMenu(caseData);
  testInfo.annotations.push({
    type: 'Resultado inicial del portal',
    description: portalResult.status === 'endpoint-timeout'
      ? `${portalResult.notification}. El procesamiento se valida mediante el correo final.`
      : portalResult.notification,
  });

  const email = await test.step('Esperar y validar correo nuevo de carga de menu', async () =>
    gmailClient.waitForCaseEmail(emailBaseline, {
      caseId: caseData.id,
      subject: caseData.expectedEmailSubject,
      bodyFields: caseData.expectedEmailBodyFields,
    }));

  await test.step('Adjuntar evidencia Gmail de carga de menu', async () => {
    await attachGmailEvidence(testInfo, caseData, email);
  });

  await test.step('Adjuntar referencia de la plantilla usada por el bloque', async () => {
    await expect(preparedTemplate.targetPath, 'La plantilla de referencia debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
    await testInfo.attach(`plantilla-referencia-menu-${caseData.id}`, {
      path: preparedTemplate.targetPath,
      contentType: excelContentType(preparedTemplate.targetPath),
    });
  });
}
