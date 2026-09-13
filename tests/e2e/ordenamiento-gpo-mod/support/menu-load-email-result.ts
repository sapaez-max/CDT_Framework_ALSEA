import type { MenuLoadPortalResult } from '@pages/menu/MenuAdministrationPage';
import type { EmailFunctionalStatus, EmailValidationResult, TemplateEmailResult } from '@src/integrations/google/gmail-client';

type CounterLabel = 'ITEMS' | 'GRUPOS_MODIFICADORES' | 'MODIFICADORES';

type ParsedCounter = {
  label: CounterLabel;
  rawValue: string;
  numericValue?: number;
  validNumber: boolean;
};

const counterLabels: CounterLabel[] = ['ITEMS', 'GRUPOS_MODIFICADORES', 'MODIFICADORES'];

export function evaluateMenuLoadEmail(email: TemplateEmailResult): EmailFunctionalStatus {
  const counters = counterLabels.map(label => extractCounter(email.bodyPreview, label));
  const items = counters.find(counter => counter.label === 'ITEMS');
  const passed = Boolean(items?.validNumber && typeof items.numericValue === 'number' && items.numericValue > 0);

  return {
    name: 'Carga de menu',
    status: passed ? 'PASS' : 'FAIL',
    message: passed
      ? `La carga del menu reporto ITEMS: ${items?.rawValue}.`
      : `La carga del menu no fue exitosa. El correo recibido reporta ITEMS: ${items?.rawValue ?? 'No encontrado'}.`,
    counters,
  };
}

export function appendMenuPortalValidation(
  email: TemplateEmailResult,
  portalResult: MenuLoadPortalResult,
): void {
  email.validations.push({
    label: 'Resultado inicial del portal',
    expected: 'Solicitud aceptada o timeout del endpoint pendiente de confirmacion por correo',
    actual: portalResult.notification,
    passed: portalResult.status === 'accepted' || portalResult.status === 'endpoint-timeout',
  });
}

export function appendMenuLoadValidations(
  email: TemplateEmailResult,
  result: EmailFunctionalStatus,
): void {
  email.functionalStatus = result;
  email.validations.push(
    ...result.counters.map(counterValidation),
    {
      label: 'Estado de carga',
      expected: 'PASS',
      actual: result.status,
      passed: result.status === 'PASS',
    },
  );
}

export function throwIfMenuLoadFailed(result: EmailFunctionalStatus): void {
  if (result.status === 'PASS') {
    return;
  }

  const summary = result.counters
    .map(counter => `${counter.label}: ${counter.rawValue}`)
    .join('\n');

  throw new Error([
    'La carga del menu no fue exitosa.',
    `El correo recibido reporta ITEMS: ${result.counters.find(counter => counter.label === 'ITEMS')?.rawValue ?? 'No encontrado'}.`,
    '',
    'Datos recibidos:',
    summary,
  ].join('\n'));
}

function extractCounter(body: string, label: CounterLabel): ParsedCounter {
  const pattern = new RegExp(`${label}\\s*[:=]\\s*([^\\s,;]+)`, 'i');
  const rawValue = pattern.exec(body)?.[1]?.trim() ?? 'No encontrado';
  const validNumber = /^\d+$/.test(rawValue);
  const numericValue = validNumber ? Number(rawValue) : undefined;

  return {
    label,
    rawValue,
    numericValue,
    validNumber,
  };
}

function counterValidation(counter: EmailFunctionalStatus['counters'][number]): EmailValidationResult {
  const expected = counter.label === 'ITEMS'
    ? 'numero valido mayor a 0'
    : 'valor recibido como evidencia';

  return {
    label: counter.label,
    expected,
    actual: counter.rawValue,
    passed: counter.label === 'ITEMS'
      ? counter.validNumber && typeof counter.numericValue === 'number' && counter.numericValue > 0
      : counter.rawValue !== 'No encontrado',
  };
}
