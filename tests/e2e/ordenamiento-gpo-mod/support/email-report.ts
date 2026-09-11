import type { TestInfo } from '@fixtures/base.fixture';
import type { TemplateEmailResult } from '@src/integrations/google/gmail-client';
import { buildEmailEvidenceHtml, excelContentType } from '@src/reporting/email-evidence';

export async function attachGmailEvidence(
  testInfo: TestInfo,
  caseData: Parameters<typeof buildEmailEvidenceHtml>[0]['caseData'],
  email: TemplateEmailResult,
): Promise<void> {
  testInfo.annotations.push(
    { type: 'Correo recibido', description: email.receivedAt },
    { type: 'Remitente', description: email.from },
    { type: 'Asunto', description: email.subject },
    { type: 'Adjunto recibido', description: email.attachmentName ?? 'No aplica' },
  );

  await testInfo.attach(`evidencia-correo-${caseData.id}`, {
    body: Buffer.from(buildEmailEvidenceHtml({ caseData, email }), 'utf8'),
    contentType: 'text/html',
  });

  await testInfo.attach(`correo-${caseData.id}`, {
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
    await testInfo.attach(`plantilla-recibida-${caseData.id}`, {
      path: email.savedPath,
      contentType: excelContentType(email.savedPath),
    });
  }
}

