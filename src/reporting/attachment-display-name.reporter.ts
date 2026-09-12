import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

const attachmentDisplayNames: Readonly<Record<string, string>> = {
  'error-context': 'Contexto técnico del fallo',
};

export default class AttachmentDisplayNameReporter implements Reporter {
  onTestEnd(_test: TestCase, result: TestResult): void {
    for (const attachment of result.attachments) {
      const displayName = attachmentDisplayNames[attachment.name];
      if (displayName) {
        attachment.name = displayName;
      }
    }
  }
}