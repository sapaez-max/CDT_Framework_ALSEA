import type { ReorderChange } from './group-reorder-template';
import type { ReorderedGroupsExpectation } from './group-reorder-template';

export type MenuModifierSnapshot = {
  id: string;
  name: string;
  position: number;
};

export type MenuGroupSnapshot = {
  id: string;
  baseGroupId?: string;
  name: string;
  position: number;
  modifiers: MenuModifierSnapshot[];
};

export type MenuSnapshot = {
  branchMenuId: string;
  itemId: string;
  name: string;
  description: string;
  categories: unknown;
  groups: MenuGroupSnapshot[];
};

export type MenuSnapshotCheck = {
  validation: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type MenuSnapshotComparison = {
  checks: MenuSnapshotCheck[];
  failures: string[];
  changedGroups: number;
  controlGroups: number;
  changedModifiers: number;
  controlModifiers: number;
};

export function parseMenuSnapshot(jsonText: string): MenuSnapshot {
  let value: unknown;
  try {
    value = JSON.parse(jsonText);
  } catch (error) {
    throw new Error('El contenido obtenido del Visor CORE no es un JSON valido.', { cause: error });
  }

  if (!isRecord(value) || !Array.isArray(value.modifierGroups)) {
    throw new Error('El JSON del Visor CORE no contiene la estructura modifierGroups esperada.');
  }

  return {
    branchMenuId: requiredText(value.sucursalMenuId, 'sucursalMenuId'),
    itemId: requiredText(value.itemId, 'itemId'),
    name: requiredText(value.name, 'name'),
    description: text(value.description),
    categories: value.categories ?? null,
    groups: value.modifierGroups.map((group, groupIndex) => {
      if (!isRecord(group) || !Array.isArray(group.modifiers)) {
        throw new Error(`El grupo en la posicion ${groupIndex} no contiene la estructura esperada.`);
      }
      return {
        id: requiredText(group.modifierGroupId, `modifierGroups[${groupIndex}].modifierGroupId`),
        name: requiredText(group.name, `modifierGroups[${groupIndex}].name`),
        position: requiredNumber(group.position, `modifierGroups[${groupIndex}].position`),
        modifiers: group.modifiers.map((modifier, modifierIndex) => {
          if (!isRecord(modifier)) {
            throw new Error(`El modificador ${modifierIndex} del grupo ${groupIndex} no es valido.`);
          }
          return {
            id: requiredText(modifier.modifierId, 'modifierId'),
            name: requiredText(modifier.name, 'modifier.name'),
            position: requiredNumber(modifier.position, 'modifier.position'),
          };
        }),
      };
    }),
  };
}

export function buildExpectedMenuSnapshotFromTemplate(
  baseline: MenuSnapshot,
  expectation: ReorderedGroupsExpectation,
  overrides: { itemName?: string } = {},
): MenuSnapshot {
  const expected = structuredClone(baseline);
  if (overrides.itemName) expected.name = overrides.itemName;

  const allJsonModifiers = buildModifierIndex(expected);

  for (const expectedGroup of expectation.groups) {
    const matchedGroup = findMatchingJsonGroup(expected, expectedGroup);
    if (!matchedGroup) continue;
    matchedGroup.position = expectedGroup.expectedOrder;
    matchedGroup.baseGroupId = expectedGroup.baseGroupId;

    for (const expectedModifier of expectedGroup.modifiers) {
      applyModifierPosition(allJsonModifiers, expectedModifier);
    }
  }

  return expected;
}

function buildModifierIndex(snapshot: MenuSnapshot): Map<string, MenuModifierSnapshot[]> {
  const index = new Map<string, MenuModifierSnapshot[]>();
  for (const group of snapshot.groups) {
    for (const modifier of group.modifiers) {
      const existing = index.get(modifier.id) ?? [];
      existing.push(modifier);
      index.set(modifier.id, existing);
    }
  }
  return index;
}

function findMatchingJsonGroup(
  baseline: MenuSnapshot,
  expectedGroup: { id: string; name: string },
): MenuGroupSnapshot | undefined {
  const byId = baseline.groups.filter(group => group.id === expectedGroup.id);
  if (byId.length === 1) return byId[0];

  const byName = baseline.groups.filter(group =>
    normalize(group.name) === normalize(expectedGroup.name));
  if (byName.length === 1) return byName[0];

  const expectedName = normalize(expectedGroup.name);
  const partialMatches = baseline.groups.filter(group => {
    const groupName = normalize(group.name);
    return groupName.includes(expectedName) || expectedName.includes(groupName);
  });
  if (partialMatches.length === 1) return partialMatches[0];

  return undefined;
}

function applyModifierPosition(
  allJsonModifiers: Map<string, MenuModifierSnapshot[]>,
  expectedModifier: { id: string; name: string; order: number },
): void {
  const candidates = allJsonModifiers.get(expectedModifier.id);
  if (!candidates || candidates.length === 0) return;

  if (candidates.length === 1) {
    candidates[0].position = expectedModifier.order;
    return;
  }

  const namedMatch = candidates.find(modifier =>
    normalize(modifier.name) === normalize(expectedModifier.name));
  if (namedMatch) {
    namedMatch.position = expectedModifier.order;
  }
}

export function compareMenuSnapshots(
  baseline: MenuSnapshot,
  expected: MenuSnapshot,
  actual: MenuSnapshot,
  changes: ReorderChange[],
): MenuSnapshotComparison {
  const checks: MenuSnapshotCheck[] = [];
  const add = (validation: string, expectedValue: unknown, actualValue: unknown) => {
    const expectedText = comparable(expectedValue);
    const actualText = comparable(actualValue);
    checks.push({
      validation,
      expected: expectedText,
      actual: actualText,
      passed: expectedText === actualText,
    });
  };

  add('Sucursal menu ID', baseline.branchMenuId, actual.branchMenuId);
  add('Item ID', baseline.itemId, actual.itemId);
  add('Nombre esperado del item', expected.name, actual.name);
  add('Descripcion del item sin cambios', baseline.description, actual.description);
  add('Categorias sin cambios', baseline.categories, actual.categories);
  add('Cantidad total de grupos', baseline.groups.length, actual.groups.length);
  add('IDs de grupos sin duplicados', baseline.groups.length, new Set(actual.groups.map(group => group.id)).size);
  add('Conjunto completo de grupos', sorted(baseline.groups.map(group => group.id)), sorted(actual.groups.map(group => group.id)));

  const changedGroupIds = new Set(
    changes.filter(change => change.entityType === 'modifierGroup').map(change => change.entityId),
  );
  const changedModifierKeys = new Set<string>();

  for (const expectedGroup of expected.groups) {
    const actualGroups = actual.groups.filter(group => group.id === expectedGroup.id);
    add(`Grupo presente una sola vez: ${expectedGroup.id}`, 1, actualGroups.length);
    if (actualGroups.length !== 1) continue;
    const actualGroup = actualGroups[0];
    const changed = expectedGroup.baseGroupId ? changedGroupIds.has(expectedGroup.baseGroupId) : false;
    add(
      `Posicion de grupo ${expectedGroup.id} (${changed ? 'modificado' : 'control'})`,
      expectedGroup.position,
      actualGroup.position,
    );
    add(`Nombre de grupo sin cambios: ${expectedGroup.id}`, expectedGroup.name, actualGroup.name);
    add(
      `Cantidad de modificadores del grupo ${expectedGroup.id}`,
      expectedGroup.modifiers.length,
      actualGroup.modifiers.length,
    );

    const expectedModifierKeys = expectedGroup.modifiers.map(modifier => modifierKey(expectedGroup.id, modifier.id));
    const actualModifierKeys = actualGroup.modifiers.map(modifier => modifierKey(actualGroup.id, modifier.id));
    add(
      `IDs de modificadores sin duplicados en ${expectedGroup.id}`,
      expectedModifierKeys.length,
      new Set(actualModifierKeys).size,
    );
    add(
      `Conjunto de modificadores de ${expectedGroup.id}`,
      sorted(expectedModifierKeys),
      sorted(actualModifierKeys),
    );

    for (const expectedModifier of expectedGroup.modifiers) {
      const actualModifiers = actualGroup.modifiers.filter(modifier => modifier.id === expectedModifier.id);
      add(
        `Modificador presente una sola vez: ${expectedGroup.id}/${expectedModifier.id}`,
        1,
        actualModifiers.length,
      );
      if (actualModifiers.length !== 1) continue;
      const change = changes.find(candidate =>
        candidate.entityType === 'modifier'
        && candidate.entityId === expectedModifier.id
        && normalize(candidate.entityName) === normalize(expectedModifier.name)
        && (!candidate.parentGroupId || (expectedGroup.baseGroupId ?? expectedGroup.id) === candidate.parentGroupId));
      const key = modifierKey(expectedGroup.id, expectedModifier.id);
      if (change) changedModifierKeys.add(key);
      add(
        `Posicion de modificador ${key} (${change ? 'modificado' : 'control'})`,
        expectedModifier.position,
        actualModifiers[0].position,
      );
      add(`Nombre de modificador sin cambios: ${key}`, expectedModifier.name, actualModifiers[0].name);
    }
  }

  const changedGroups = expected.groups.filter(group =>
    group.baseGroupId ? changedGroupIds.has(group.baseGroupId) : false).length;
  const totalModifiers = expected.groups.reduce((total, group) => total + group.modifiers.length, 0);

  return {
    checks,
    failures: checks.filter(check => !check.passed).map(check =>
      `${check.validation}: esperado ${check.expected}; actual ${check.actual}`),
    changedGroups,
    controlGroups: expected.groups.length - changedGroups,
    changedModifiers: changedModifierKeys.size,
    controlModifiers: totalModifiers - changedModifierKeys.size,
  };
}

function verifyPreviousPosition(change: ReorderChange, actual: number): void {
  const expectedPrevious = Number(change.previousValue);
  if (!Number.isFinite(expectedPrevious) || expectedPrevious !== actual) {
    throw new Error(
      `El estado inicial de ${change.entityType} ${change.entityId} no coincide con el Excel: esperado ${change.previousValue}, actual ${actual}.`,
    );
  }
}

function modifierKey(groupId: string, modifierId: string): string {
  return `${groupId}::${modifierId}`;
}

function sorted(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function comparable(value: unknown): string {
  return typeof value === 'string' ? normalize(value) : JSON.stringify(value);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function requiredText(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new Error(`El campo ${field} no tiene un valor valido en el JSON del Visor CORE.`);
  return result;
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function requiredNumber(value: unknown, field: string): number {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`El campo ${field} no es numerico en el JSON del Visor CORE.`);
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
