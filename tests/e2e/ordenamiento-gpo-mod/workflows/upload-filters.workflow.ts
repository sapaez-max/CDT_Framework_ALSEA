import { expect, test, type Page, type TestInfo } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { GmailClient } from '@src/integrations/google/gmail-client';
import { excelContentType } from '@src/reporting/email-evidence';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import type { FilterLoadCase } from '../data/cases.data';
import { ExcelService } from '../services/excel.service';
import { GmailService } from '../services/gmail.service';
import { attachGmailEvidence } from '../support/email-report';
import {
  annotateExecutionContext,
  artifactScope,
  createExecutionContext,
  type ExecutionContext,
} from '../support/execution-context';
import { goToLanding } from '../support/navigation';

export async function uploadFiltersWorkflow(
  page: Page,
  caseData: FilterLoadCase,
  testInfo: TestInfo,
  gmailClient?: GmailClient,
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
  context.files.edited = prepared.sourcePath;
  context.files.uploaded = prepared.targetPath;
  const menuPage = new MenuAdministrationPage(page);
  const gmail = gmailClient ? new GmailService(gmailClient) : undefined;
  const baseline = caseData.expectedEmailSubject
    ? await test.step('Capturar linea base de Gmail', async () => {
        if (!gmail) throw new Error(`${caseData.id} requiere Gmail para validar el resultado.`);
        return gmail.captureCaseBaseline();
      })
    : undefined;

  await test.step('Cargar la plantilla de filtros con los datos seleccionados', async () => {
    await menuPage.openFilterLoad();
    await menuPage.loadFilters(caseData, prepared.targetPath, {
      allowPendingResponse: Boolean(
        caseData.expectedEmailSubject
        && caseData.expectedEmailBodyFields,
      ),
    });
  });

  if (caseData.expectedEmailSubject && caseData.expectedEmailBodyFields && baseline && gmail) {
    const email = await test.step('Esperar y validar correo de carga de filtros', () =>
      gmail.waitForCase(baseline, {
        caseId: caseData.id,
        subject: caseData.expectedEmailSubject!,
        bodyFields: caseData.expectedEmailBodyFields!,
        artifactScope: artifactScope(context),
      }));
    await attachGmailEvidence(testInfo, caseData, email, 'filter-load');
  }

  expect(prepared.targetPath, 'La plantilla cargada debe ser un archivo Excel').toMatch(/\.xlsx?$/i);
  await testInfo.attach(buildExcelAttachmentName('Plantilla enviada para carga de filtros', prepared.targetPath), {
    path: prepared.targetPath,
    contentType: excelContentType(prepared.targetPath),
  });
  return context;
}

