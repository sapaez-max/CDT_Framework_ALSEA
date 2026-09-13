import type { TestInfo } from '@fixtures/base.fixture';
import type { TemplateEmailResult } from '@src/integrations/google/gmail-client';
import { buildExcelAttachmentName } from '@src/reporting/attachment-name';
import { buildEmailEvidenceHtml, excelContentType } from '@src/reporting/email-evidence';

type GmailEvidencePurpose = 'filter-load' | 'menu-load';

const purposeTitles: Record<GmailEvidencePurpose, { validation: string; technical: string }> = {
  'filter-load': {
    validation: 'Validación del correo de carga de filtros',
    technical: 'Detalle técnico del correo de carga de filtros',
  },
  'menu-load': {
    validation: 'Validación del correo de carga de menú',
    technical: 'Detalle técnico del correo de carga de menú',
  },
};

export async function attachGmailEvidence(
  testInfo: TestInfo,
  caseData: Parameters<typeof buildEmailEvidenceHtml>[0]['caseData'],
  email: TemplateEmailResult,
  purpose?: GmailEvidencePurpose,
): Promise<void> {
  const titles = purpose
    ? purposeTitles[purpose]
    : {
        validation: 'Validación del correo recibido',
        technical: 'Detalle técnico de validación del correo',
      };
  await testInfo.attach(titles.validation, {
    body: Buffer.from(buildEmailEvidenceHtml({ caseData, email }), 'utf8'),
    contentType: 'text/html',
  });

  await testInfo.attach(titles.technical, {
    body: Buffer.from(JSON.stringify({
      messageId: email.messageId,
      threadId: email.threadId,
      receivedAt: email.receivedAt,
      from: email.from,
      subject: email.subject,
      attachmentName: email.attachmentName,
      savedPath: email.savedPath,
      functionalStatus: email.functionalStatus,
      validations: email.validations,
    }, null, 2), 'utf8'),
    contentType: 'application/json',
  });

  if (email.savedPath) {
    await testInfo.attach(buildExcelAttachmentName('Plantilla Excel recibida', email.savedPath), {
      path: email.savedPath,
      contentType: excelContentType(email.savedPath),
    });
  }
}

