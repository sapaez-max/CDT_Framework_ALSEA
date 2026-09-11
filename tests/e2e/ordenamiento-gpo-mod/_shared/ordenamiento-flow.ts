import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient, TemplateEmailResult } from '@src/integrations/google/gmail-client';
import { buildEmailEvidenceHtml, excelContentType } from '@src/reporting/email-evidence';
import type { TemplateDownloadCase } from './casos.data';

export async function ejecutarDescargaPlantilla(
  page: Page,
  gmailClient: GmailClient,
  testInfo: TestInfo,
  caseData: TemplateDownloadCase,
): Promise<void> {
  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const menuPage = new MenuAdministrationPage(page);
  await test.step('Preparar descarga de plantilla', async () => {
    await menuPage.openTemplateDownload();
    await menuPage.prepareTemplateDownload(caseData);
  });

  const baselineIds = await test.step('Capturar linea base de Gmail', async () =>
    gmailClient.captureTemplateEmailBaseline());

  await test.step('Solicitar plantilla', async () => {
    await menuPage.requestTemplateDownload(caseData.expectedMessage);
  });

  const email = await test.step('Esperar correo nuevo y descargar Excel', async () =>
    gmailClient.waitForTemplateEmail(baselineIds, {
      caseId: caseData.id,
      country: caseData.country,
      brand: caseData.brand,
      branch: caseData.baseBranch ?? [],
      menuType: caseData.menuType,
    }));

  await test.step('Validar remitente, asunto, contenido y adjunto', async () => {
    for (const validation of email.validations) {
      expect(validation.passed, `${validation.label}: esperado "${validation.expected}", encontrado "${validation.actual}"`).toBe(true);
    }
    expect(email.savedPath, 'El correo de descarga debe incluir un adjunto Excel guardado').toBeTruthy();
    expect(email.savedPath, 'El adjunto de Gmail debe guardarse como archivo Excel').toMatch(/\.xlsx?$/i);
  });

  await test.step('Adjuntar evidencia al reporte', async () => {
    await attachGmailEvidence(testInfo, caseData, email);
  });
}

export async function attachGmailEvidence(
  testInfo: TestInfo,
  caseData: Parameters<typeof buildEmailEvidenceHtml>[0]['caseData'],
  email: TemplateEmailResult,
): Promise<void> {
  await testInfo.attach(`correo-${caseData.id}`, {
    body: Buffer.from(JSON.stringify({
      messageId: email.messageId,
      threadId: email.threadId,
      receivedAt: email.receivedAt,
      from: email.from,
      subject: email.subject,
      attachmentName: email.attachmentName,
      savedPath: email.savedPath,
      validations: email.validations,
    }, null, 2)),
    contentType: 'application/json',
  });

  await testInfo.attach(`evidencia-correo-${caseData.id}`, {
    body: Buffer.from(buildEmailEvidenceHtml({ caseData, email }), 'utf8'),
    contentType: 'text/html',
  });

  if (email.savedPath) {
    await testInfo.attach(`plantilla-recibida-${caseData.id}`, {
      path: email.savedPath,
      contentType: excelContentType(email.savedPath),
    });
  }
}

export async function goToLanding(page: Page): Promise<void> {
  await page.goto(env.login.landingPath, { waitUntil: 'commit' }).catch((error: Error) => {
    if (!/ERR_ABORTED/i.test(error.message)) {
      throw error;
    }
  });
}
