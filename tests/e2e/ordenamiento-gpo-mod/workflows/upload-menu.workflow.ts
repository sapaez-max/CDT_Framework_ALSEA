import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import type { MenuLoadCase } from '../data/types';
import { ExcelService } from '../services/excel.service';
import { GmailService } from '../services/gmail.service';
import { attachGmailEvidence } from '../support/email-report';
import {
  annotateExecutionContext,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import {
  appendMenuLoadValidations,
  appendMenuPortalValidation,
  evaluateMenuLoadEmail,
  throwIfMenuLoadFailed,
} from '../support/menu-load-email-result';
import { goToLanding } from '../support/navigation';

export async function uploadMenuWorkflow(
  page: Page,
  caseData: MenuLoadCase,
  testInfo: TestInfo,
  gmailClient: GmailClient,
): Promise<ExecutionContext> {
  const context = createExecutionContext(caseData);
  annotateExecutionContext(testInfo, context, caseData);
  await test.step('Acceder al portal con la sesion autorizada', async () => {
    await goToLanding(page);
    await new LoginPage(page).expectAuthenticated();
  });

  const prepared = await test.step(
    `Copiar plantilla generada por ${caseData.sourceCaseId}`,
    () => new ExcelService().copyFromCase(
      caseData.sourceCaseId,
      caseData.id,
      artifactScope(context),
    ),
  );
  context.files.uploaded = prepared.targetPath;
  const menuPage = new MenuAdministrationPage(page);
  const gmail = new GmailService(gmailClient);
  const baseline = await test.step('Capturar linea base de Gmail', () =>
    gmail.captureCaseBaseline());

  const portalResult = await test.step(
    'Publicar el menu para la marca y sucursal seleccionadas',
    async () => {
      await menuPage.openMenuLoad();
      return menuPage.loadMenu(caseData);
    },
  );

  const email = await test.step('Esperar y validar correo de carga de menu', () =>
    gmail.waitForCase(baseline, {
      caseId: caseData.id,
      subject: caseData.expectedEmailSubject,
      bodyFields: caseData.expectedEmailBodyFields,
      artifactScope: artifactScope(context),
    }));
  const loadResult = evaluateMenuLoadEmail(email);
  appendMenuPortalValidation(email, portalResult);
  appendMenuLoadValidations(email, loadResult);
  await attachGmailEvidence(testInfo, caseData, email, 'menu-load');
  throwIfMenuLoadFailed(loadResult);

  expect(prepared.targetPath, 'La plantilla de referencia debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  await testInfo.attach(buildExcelAttachmentName('Plantilla utilizada para generar el menú', prepared.targetPath), {
    path: prepared.targetPath,
    contentType: excelContentType(prepared.targetPath),
  });
  return context;
}

