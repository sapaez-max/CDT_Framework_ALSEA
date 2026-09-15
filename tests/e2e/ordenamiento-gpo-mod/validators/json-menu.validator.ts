import { expect, type Page, type TestInfo } from '@fixtures/base.fixture';
import { CoreViewerPage } from '@pages/menu/CoreViewerPage';
import {
  buildJsonComparisonHtml,
  type JsonComparisonRow,
  type JsonOrderComparison,
} from '@src/reporting/json-comparison';
import type {
  CoreViewerModifierExpectation,
  CoreViewerTemplateExpectation,
} from '@utils/core-viewer-template';
import type { JsonValidationCase } from '../data/cases.data';

type ComparedModifier = {
  expectation: CoreViewerModifierExpectation;
  entityObject?: Record<string, unknown>;
};

type JsonContentComparison = {
  rows: JsonComparisonRow[];
  modifierOrder: JsonOrderComparison;
};

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
  await attachJsonEvidence(testInfo, jsonText);

  const comparison = compareJsonContent(jsonText, expectation);
  await attachJsonComparison(testInfo, caseData, expectation, comparison);
  validateJsonContent(comparison);
}

function compareJsonContent(
  jsonText: string,
  expectation: CoreViewerTemplateExpectation,
): JsonContentComparison {
  const parsedJson = parseJson(jsonText);
  const allObjects = collectObjects(parsedJson);
  const itemObject = findObjectByIdentifier(allObjects, expectation.itemId, /^(itemId|id)$/i);
  const itemScope = itemObject ? collectObjects(itemObject) : [];

  const groupObject = findObjectByIdentifier(
    itemScope,
    expectation.resolvedGroupId,
    /^(modifierGroupId|groupModifierId|groupId|id)$/i,
  );
  const groupScope = groupObject ? collectObjects(groupObject) : [];

  const modifiers: ComparedModifier[] = expectation.modifiers.map(modifier => ({
    expectation: modifier,
    entityObject: findObjectByIdentifier(groupScope, modifier.id, /^(modifierId|id)$/i),
  }));

  const expectedModifierOrder = expectation.modifiers.map(modifier => modifier.name);
  const actualModifierOrder = modifiers
    .map(modifier => ({
      name: scalarValue(modifier.entityObject, /^(name|nombre|nombreComercial)$/i),
      position: firstOrder(modifier.entityObject),
    }))
    .filter((modifier): modifier is { name: string; position: number } =>
      modifier.name !== undefined && modifier.position !== undefined)
    .sort((left, right) => left.position - right.position)
    .map(modifier => modifier.name);

  const modifierOrder: JsonOrderComparison = {
    expected: expectedModifierOrder.join(' → '),
    actual: actualModifierOrder.length > 0 ? actualModifierOrder.join(' → ') : 'No encontrado',
    passed: arraysEqual(actualModifierOrder, expectedModifierOrder),
  };

  return {
    rows: [
      entityRow(
        'Item',
        expectation.itemId,
        expectation.itemName,
        undefined,
        itemObject,
        /^(itemId|id)$/i,
      ),
      entityRow(
        'Grupo modificador',
        expectation.resolvedGroupId,
        expectation.resolvedGroupName,
        expectation.groupOrder,
        groupObject,
        /^(modifierGroupId|groupModifierId|groupId|id)$/i,
      ),
      ...modifiers.map(modifier => entityRow(
        'Modificador',
        modifier.expectation.id,
        modifier.expectation.name,
        modifier.expectation.order,
        modifier.entityObject,
        /^(modifierId|id)$/i,
      )),
    ],
    modifierOrder,
  };
}

function validateJsonContent(comparison: JsonContentComparison): void {
  for (const row of comparison.rows) {
    expect(
      row.passed,
      [
        `${row.entity} no coincide con la plantilla.`,
        `Identificador esperado: ${row.expectedIdentifier}.`,
        `Identificador obtenido: ${row.actualIdentifier}.`,
        `Nombre esperado: ${row.expectedName}.`,
        `Nombre obtenido: ${row.actualName}.`,
        `Posición esperada: ${row.expectedPosition}.`,
        `Posición obtenida: ${row.actualPosition}.`,
      ].join(' '),
    ).toBe(true);
  }

  expect(
    comparison.modifierOrder.passed,
    [
      'El orden de los modificadores no coincide con la plantilla.',
      `Esperado: ${comparison.modifierOrder.expected}.`,
      `Obtenido: ${comparison.modifierOrder.actual}.`,
    ].join(' '),
  ).toBe(true);
}

function entityRow(
  entity: string,
  expectedIdentifier: string,
  expectedName: string,
  expectedPosition: number | undefined,
  object: Record<string, unknown> | undefined,
  identifierPattern: RegExp,
): JsonComparisonRow {
  const actualIdentifier = scalarValue(object, identifierPattern)
    ?? matchingScalarValue(object, expectedIdentifier);
  const actualName = scalarValue(object, /^(name|nombre|nombreComercial)$/i);
  const actualPositions = exposedOrders(object ? [object] : []);
  const positionApplies = expectedPosition !== undefined;

  return {
    entity,
    expectedIdentifier,
    actualIdentifier: actualIdentifier ?? 'No encontrado',
    expectedName,
    actualName: actualName ?? 'No encontrado',
    expectedPosition: positionApplies ? String(expectedPosition) : 'No aplica',
    actualPosition: positionApplies
      ? (actualPositions.length > 0 ? [...new Set(actualPositions)].join(', ') : 'No encontrado')
      : 'No aplica',
    passed: actualIdentifier === expectedIdentifier
      && actualName === expectedName
      && (!positionApplies || actualPositions.includes(expectedPosition)),
  };
}

function firstOrder(object: Record<string, unknown> | undefined): number | undefined {
  return object ? exposedOrders([object])[0] : undefined;
}

function exposedOrders(objects: Record<string, unknown>[]): number[] {
  return objects
    .flatMap(orderValues)
    .filter(value => Number.isFinite(value));
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

function findObjectByIdentifier(
  objects: Record<string, unknown>[],
  expected: string,
  keyPattern: RegExp,
): Record<string, unknown> | undefined {
  const keyedMatch = objects.find(candidate => Object.entries(candidate).some(([key, value]) =>
    keyPattern.test(key) && isScalar(value) && String(value) === expected));
  return keyedMatch ?? objects.find(candidate => matchingScalarValue(candidate, expected) !== undefined);
}

function matchingScalarValue(
  object: Record<string, unknown> | undefined,
  expected: string,
): string | undefined {
  if (!object) return undefined;
  const value = Object.values(object).find(candidate => isScalar(candidate) && String(candidate) === expected);
  return value === undefined ? undefined : String(value);
}

function scalarValue(
  object: Record<string, unknown> | undefined,
  keyPattern: RegExp,
): string | undefined {
  if (!object) return undefined;
  const entry = Object.entries(object).find(([key, value]) => keyPattern.test(key) && isScalar(value));
  return entry ? String(entry[1]) : undefined;
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function arraysEqual(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
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

async function attachJsonComparison(
  testInfo: TestInfo,
  caseData: JsonValidationCase,
  expectation: CoreViewerTemplateExpectation,
  comparison: JsonContentComparison,
): Promise<void> {
  await testInfo.attach('Comparación de datos esperados y obtenidos en el JSON', {
    body: Buffer.from(buildJsonComparisonHtml({
      caseId: caseData.id,
      title: caseData.title,
      context: {
        country: caseData.country,
        brand: caseData.brand,
        branch: caseData.branch,
        aggregator: caseData.aggregator,
        menuType: caseData.menuType,
      },
      sourceFile: expectation.inputPath,
      rows: comparison.rows,
      modifierOrder: comparison.modifierOrder,
    }), 'utf8'),
    contentType: 'text/html',
  });
}

async function attachJsonEvidence(testInfo: TestInfo, jsonText: string): Promise<void> {
  await testInfo.attach('JSON publicado del menú', {
    body: Buffer.from(jsonText, 'utf8'),
    contentType: 'application/json',
  });
}
