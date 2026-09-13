import { expect, type Page, type TestInfo } from '@fixtures/base.fixture';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import type { CoreViewerTemplateExpectation } from '@utils/core-viewer-template';
import type { JsonValidationCase } from '../data/cases.data';

export async function validatePublishedMenuJson(
  page: Page,
  caseData: JsonValidationCase,
  expectation: CoreViewerTemplateExpectation,
  testInfo: TestInfo,
): Promise<void> {
  const visor = new CoreViewerPage(page);
  await visor.open();
  await visor.applyFilters(caseData);

  const jsonText = await visor.openTemplateJson(expectation);
  await attachJsonEvidence(testInfo, caseData.id, jsonText);
  validateJsonContent(jsonText, expectation);
}

function validateJsonContent(jsonText: string, expectation: CoreViewerTemplateExpectation): void {
  expect(jsonText, `El JSON debe contener el item ${expectation.itemId}`).toContain(expectation.itemId);
  expect(jsonText, `El JSON debe contener el nombre del item ${expectation.itemName}`).toContain(expectation.itemName);
  expect(jsonText, `El JSON debe contener el grupo modificador ${expectation.groupId}`).toContain(expectation.groupId);
  expect(jsonText, `El JSON debe contener el nombre del grupo ${expectation.groupName}`).toContain(expectation.groupName);

  for (const modifier of expectation.modifiers) {
    expect(jsonText, `El JSON debe contener el modificador ${modifier.id}`).toContain(modifier.id);
    expect(jsonText, `El JSON debe contener el nombre del modificador ${modifier.name}`).toContain(modifier.name);
  }

  const modifierPositions = expectation.modifiers.map(modifier => jsonText.indexOf(modifier.name));
  expect(
    modifierPositions.every(position => position >= 0),
    `Todos los modificadores esperados deben existir en el JSON: ${expectation.modifiers.map(item => item.name).join(', ')}`,
  ).toBe(true);
  expect(
    modifierPositions,
    'Los modificadores deben conservar en el JSON el orden definido en la plantilla',
  ).toEqual([...modifierPositions].sort((left, right) => left - right));

  const parsedJson = parseJson(jsonText);
  const allObjects = collectObjects(parsedJson);
  const groupObjects = allObjects.filter(candidate =>
    objectContains(candidate, expectation.groupId) || objectContains(candidate, expectation.groupName));
  expect(
    groupObjects.length,
    `Debe existir un nodo JSON para el grupo ${expectation.groupId} - ${expectation.groupName}`,
  ).toBeGreaterThan(0);

  assertOrderIsExposed(groupObjects, expectation.groupOrder, `grupo ${expectation.groupId}`);

  for (const modifier of expectation.modifiers) {
    const modifierObjects = allObjects.filter(candidate =>
      objectContains(candidate, modifier.id) || objectContains(candidate, modifier.name));
    expect(
      modifierObjects.length,
      `Debe existir un nodo JSON para el modificador ${modifier.id} - ${modifier.name}`,
    ).toBeGreaterThan(0);
    assertOrderIsExposed(modifierObjects, modifier.order, `modificador ${modifier.id}`);
  }
}

function assertOrderIsExposed(objects: Record<string, unknown>[], expectedOrder: number, label: string): void {
  const exposedOrders = objects
    .flatMap(orderValues)
    .filter(value => Number.isFinite(value));

  expect(
    exposedOrders.length,
    `El JSON debe exponer un campo de orden/posicion para ${label}`,
  ).toBeGreaterThan(0);

  expect(
    exposedOrders,
    `El JSON debe exponer el orden ${expectedOrder} para ${label}`,
  ).toContain(expectedOrder);
}

function orderValues(value: unknown): number[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => /orden|order|position|posicion|sort/i.test(key))
    .map(([, rawValue]) => Number(rawValue))
    .filter(value => Number.isFinite(value));
}

function objectContains(value: Record<string, unknown>, expected: string): boolean {
  return JSON.stringify(value).includes(expected);
}

function parseJson(jsonText: string): unknown {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error('El contenido mostrado por Ver JSON no es JSON valido.', { cause: error });
  }
}

function collectObjects(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectObjects);
  }

  const record = value as Record<string, unknown>;
  return [
    record,
    ...Object.values(record).flatMap(collectObjects),
  ];
}

async function attachJsonEvidence(testInfo: TestInfo, caseId: string, jsonText: string): Promise<void> {
  await testInfo.attach('JSON publicado del menú', {
    body: Buffer.from(jsonText, 'utf8'),
    contentType: 'application/json',
  });
}
