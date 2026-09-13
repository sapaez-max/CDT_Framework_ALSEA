import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import type { TemplateDownloadCase } from '../data/types';
import { GmailService } from '../services/gmail.service';
import { attachGmailEvidence } from '../support/email-report';
import {
  annotateExecutionContext,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import { goToLanding } from '../support/navigation';

export async function downloadTemplateWorkflow(
  page: Page,
  gmailClient: GmailClient,
  testInfo: TestInfo,
  caseData: TemplateDownloadCase,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context, caseData);

  await test.step('Validar sesion autenticada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const menuPage = new MenuAdministrationPage(page);
  await test.step('Preparar descarga de plantilla', async () => {
    await menuPage.openTemplateDownload();
    await menuPage.prepareTemplateDownload(caseData);
  });

  const gmail = new GmailService(gmailClient);
  const baseline = await test.step(
    'Capturar linea base de Gmail',
    () => gmail.captureTemplateBaseline(),
  );

  await test.step('Solicitar plantilla', async () => {
    await menuPage.requestTemplateDownload(caseData.expectedMessage);
  });

  const email = await test.step('Esperar correo nuevo y descargar Excel', () =>
    gmail.waitForTemplate(baseline, {
      caseId: caseData.id,
      country: caseData.country,
      brand: caseData.brand,
      branch: caseData.baseBranch ?? [],
      menuType: caseData.menuType,
      artifactScope: artifactScope(context),
    }));

  for (const validation of email.validations) {
    expect(
      validation.passed,
      `${validation.label}: esperado "${validation.expected}", encontrado "${validation.actual}"`,
    ).toBe(true);
  }
  expect(email.savedPath, 'El correo debe incluir un adjunto Excel guardado').toMatch(/\.xlsx?$/i);
  context.files.downloaded = email.savedPath;
  await attachGmailEvidence(testInfo, caseData, email);
  return context;
}

