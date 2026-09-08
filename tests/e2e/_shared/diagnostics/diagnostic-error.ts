import type { Page, TestInfo } from '@playwright/test';
import { classifyFailure } from './failure-cause';

export async function buildDiagnosticError(error: unknown, page: Page, testInfo: TestInfo): Promise<Error> {
  const original = error instanceof Error ? error : new Error(String(error));
  const cause = classifyFailure(original.message);
  const details = [
    `Test: ${testInfo.title}`,
    `Archivo: ${testInfo.file}`,
    `Causa probable: ${cause}`,
    `URL actual: ${page.url()}`,
    `Mensaje original: ${original.message}`,
  ];

  const diagnostic = new Error(details.join('\n'));
  diagnostic.stack = original.stack;
  return diagnostic;
}
