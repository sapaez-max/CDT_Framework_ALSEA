import fs from 'fs';
import xlsx, { type WorkBook, type WorkSheet } from 'xlsx';
import {
  copyExcelFromPreviousCase,
  type ArtifactScope,
  type CaseExcelCopy,
} from './case-artifact-manager';
import type { CoreViewerModifierExpectation } from './core-viewer-template';

export type GroupReorderRequest = {
  caseId: string;
  sourceCaseId: string;
  aggregator: string;
  artifactScope: ArtifactScope;
  sourceCopy?: CaseExcelCopy;
  strategy?: 'complete' | 'selective-update';
};

export type ReorderedGroupExpectation = {
  id: string;
  name: string;
  previousOrder: number;
  expectedOrder: number;
  modifiers: CoreViewerModifierExpectation[];
};

export type ReorderedGroupsExpectation = {
  inputPath: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  categoryName: string;
  groups: ReorderedGroupExpectation[];
};

export type GroupReorderResult = {
  sourcePath: string;
  inputPath: string;
  outputPath: string;
  expectation: ReorderedGroupsExpectation;
  changes: ReorderChange[];
};

export type ReorderChange = {
  sheet: string;
  cell: string;
  field: string;
  entityType: 'modifierGroup' | 'modifier';
  entityId: string;
  entityName: string;
  parentGroupId?: string;
  previousValue: string;
  newValue: string;
};

type SheetTable = {
  name: string;
  sheet: WorkSheet;
  rows: unknown[][];
  headers: unknown[];
};

type GroupSelection = {
  itemId: string;
  itemRow: number;
  categoryName: string;
  groupRows: Array<{
    row: number;
    id: string;
    name: string;
    order: number;
    modifiers: CoreViewerModifierExpectation[];
  }>;
};

export function reorderOnlyGroups(request: GroupReorderRequest): GroupReorderResult {
  const { sourcePath, targetPath: inputPath } = copyExcelFromPreviousCase({
    fromCase: request.sourceCaseId,
    toCase: request.caseId,
    scope: request.artifactScope,
  });
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const originalSheetNames = [...workbook.SheetNames];
  const originalRowCounts = Object.fromEntries(
    originalSheetNames.map(name => [name, sheetRows(workbook.Sheets[name]).length]),
  );

  const items = requiredTable(workbook, 'Items');
  const categories = requiredTable(workbook, 'Categorias');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const itemDescriptionColumn = requiredColumn(items, ['Descripcion']);
  const categoryItemColumn = requiredColumn(categories, ['Item']);
  const categoryNameColumn = requiredColumn(categories, ['Categoria', 'Nombre Categoria']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupOrderColumn = requiredColumn(groups, ['Orden', 'Posicion']);
  const groupAggregatorColumn = requiredColumn(groups, [request.aggregator]);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const modifierOrderColumn = requiredColumn(modifiers, ['Orden', 'Posicion']);
  const modifierAggregatorColumn = requiredColumn(modifiers, [request.aggregator]);

  const selection = selectItemWithThreeGroups({
    items,
    categories,
    groups,
    modifiers,
    itemColumn,
    categoryItemColumn,
    categoryNameColumn,
    groupIdColumn,
    groupNameColumn,
    groupOrderColumn,
    groupAggregatorColumn,
    modifierItemColumn,
    modifierGroupColumn,
    modifierIdColumn,
    modifierNameColumn,
    modifierOrderColumn,
    modifierAggregatorColumn,
    aggregator: request.aggregator,
  });

  const orderedGroups = [...selection.groupRows].sort((left, right) => left.order - right.order);
  const reorderedOrders = orderedGroups.map(group => group.order).reverse();

  const changes: ReorderChange[] = [];
  orderedGroups.forEach((group, index) => {
    changes.push(writeCell(groups, group.row, groupOrderColumn, reorderedOrders[index], {
      entityType: 'modifierGroup',
      entityId: group.id,
      entityName: group.name,
    }));
  });

  xlsx.writeFile(workbook, inputPath, { compression: true, cellStyles: true });
  verifySavedTemplate(inputPath, originalSheetNames, originalRowCounts);

  const saved = xlsx.readFile(inputPath, { cellStyles: true });
  const savedGroups = requiredTable(saved, 'GrupoModificador');
  const expectationGroups = orderedGroups
    .map((group, index) => {
      const savedOrder = Number(savedGroups.rows[group.row][groupOrderColumn]);
      if (savedOrder !== reorderedOrders[index]) {
        throw new Error(
          `No se guardo el nuevo orden del grupo ${group.id}. Esperado: ${reorderedOrders[index]}. Actual: ${savedOrder}.`,
        );
      }

      return {
        id: group.id,
        name: group.name,
        previousOrder: group.order,
        expectedOrder: reorderedOrders[index],
        modifiers: [...group.modifiers].sort((left, right) => left.order - right.order),
      };
    })
    .sort((left, right) => left.expectedOrder - right.expectedOrder);

  return {
    sourcePath,
    inputPath,
    outputPath: inputPath,
    changes,
    expectation: {
      inputPath,
      itemId: selection.itemId,
      itemName: displayValue(items.rows[selection.itemRow][itemNameColumn]),
      itemDescription: displayValue(items.rows[selection.itemRow][itemDescriptionColumn]),
      categoryName: selection.categoryName,
      groups: expectationGroups,
    },
  };
}

export function reorderOnlyModifiers(request: GroupReorderRequest): GroupReorderResult {
  const { sourcePath, targetPath: inputPath } = copyExcelFromPreviousCase({
    fromCase: request.sourceCaseId,
    toCase: request.caseId,
    scope: request.artifactScope,
  });
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const originalSheetNames = [...workbook.SheetNames];
  const originalRowCounts = Object.fromEntries(
    originalSheetNames.map(name => [name, sheetRows(workbook.Sheets[name]).length]),
  );

  const items = requiredTable(workbook, 'Items');
  const categories = requiredTable(workbook, 'Categorias');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const itemDescriptionColumn = requiredColumn(items, ['Descripcion']);
  const categoryItemColumn = requiredColumn(categories, ['Item']);
  const categoryNameColumn = requiredColumn(categories, ['Categoria', 'Nombre Categoria']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupOrderColumn = requiredColumn(groups, ['Orden', 'Posicion']);
  const groupAggregatorColumn = requiredColumn(groups, [request.aggregator]);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const modifierOrderColumn = requiredColumn(modifiers, ['Orden', 'Posicion']);
  const modifierAggregatorColumn = requiredColumn(modifiers, [request.aggregator]);

  const selection = selectItemWithThreeGroups({
    items,
    categories,
    groups,
    modifiers,
    itemColumn,
    categoryItemColumn,
    categoryNameColumn,
    groupIdColumn,
    groupNameColumn,
    groupOrderColumn,
    groupAggregatorColumn,
    modifierItemColumn,
    modifierGroupColumn,
    modifierIdColumn,
    modifierNameColumn,
    modifierOrderColumn,
    modifierAggregatorColumn,
    aggregator: request.aggregator,
  });

  const orderedGroups = [...selection.groupRows].sort((left, right) => left.order - right.order);
  const targetGroup = orderedGroups.find(group => group.modifiers.length >= 3);
  if (!targetGroup) {
    throw new Error('No se encontro un grupo con al menos 3 modificadores para reordenar.');
  }

  const targetModifiers = targetGroup.modifiers;
  const reorderedModifierOrders = targetModifiers.map(modifier => modifier.order).reverse();
  const modifierRowById = new Map<string, number>();
  for (let row = 1; row < modifiers.rows.length; row += 1) {
    if (
      canonicalId(modifiers.rows[row][modifierItemColumn]) === selection.itemId
      && canonicalId(modifiers.rows[row][modifierGroupColumn]) === targetGroup.id
      && isEnabled(modifiers.rows[row][modifierAggregatorColumn])
    ) {
      modifierRowById.set(canonicalId(modifiers.rows[row][modifierIdColumn]), row);
    }
  }

  const changes: ReorderChange[] = [];
  targetModifiers.forEach((modifier, index) => {
    const row = modifierRowById.get(modifier.id);
    if (row === undefined) {
      throw new Error(`No se encontro la fila del modificador ${modifier.id} para reordenar.`);
    }
    changes.push(writeCell(modifiers, row, modifierOrderColumn, reorderedModifierOrders[index], {
      entityType: 'modifier',
      entityId: modifier.id,
      entityName: modifier.name,
      parentGroupId: targetGroup.id,
    }));
  });

  xlsx.writeFile(workbook, inputPath, { compression: true, cellStyles: true });
  verifySavedTemplate(inputPath, originalSheetNames, originalRowCounts);

  const saved = xlsx.readFile(inputPath, { cellStyles: true });
  const savedModifiers = requiredTable(saved, 'Modificadores');
  const expectationGroups = orderedGroups
    .map(group => {
      const expectedModifiers = group.id === targetGroup.id
        ? targetModifiers
          .map((modifier, index) => {
            const row = modifierRowById.get(modifier.id);
            const savedOrder = Number(savedModifiers.rows[row ?? -1]?.[modifierOrderColumn]);
            if (savedOrder !== reorderedModifierOrders[index]) {
              throw new Error(
                `No se guardo el nuevo orden del modificador ${modifier.id}. Esperado: ${reorderedModifierOrders[index]}. Actual: ${savedOrder}.`,
              );
            }
            return {
              ...modifier,
              order: reorderedModifierOrders[index],
            };
          })
          .sort((left, right) => left.order - right.order)
        : [...group.modifiers].sort((left, right) => left.order - right.order);

      return {
        id: group.id,
        name: group.name,
        previousOrder: group.order,
        expectedOrder: group.order,
        modifiers: expectedModifiers,
      };
    })
    .sort((left, right) => left.expectedOrder - right.expectedOrder);

  return {
    sourcePath,
    inputPath,
    outputPath: inputPath,
    changes,
    expectation: {
      inputPath,
      itemId: selection.itemId,
      itemName: displayValue(items.rows[selection.itemRow][itemNameColumn]),
      itemDescription: displayValue(items.rows[selection.itemRow][itemDescriptionColumn]),
      categoryName: selection.categoryName,
      groups: expectationGroups,
    },
  };
}

export function reorderGroupsAndModifiers(request: GroupReorderRequest): GroupReorderResult {
  const { sourcePath, targetPath: inputPath } = request.sourceCopy ?? copyExcelFromPreviousCase({
    fromCase: request.sourceCaseId,
    toCase: request.caseId,
    scope: request.artifactScope,
  });
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const originalSheetNames = [...workbook.SheetNames];
  const originalRowCounts = Object.fromEntries(
    originalSheetNames.map(name => [name, sheetRows(workbook.Sheets[name]).length]),
  );

  const items = requiredTable(workbook, 'Items');
  const categories = requiredTable(workbook, 'Categorias');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const itemDescriptionColumn = requiredColumn(items, ['Descripcion']);
  const categoryItemColumn = requiredColumn(categories, ['Item']);
  const categoryNameColumn = requiredColumn(categories, ['Categoria', 'Nombre Categoria']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupOrderColumn = requiredColumn(groups, ['Orden', 'Posicion']);
  const groupAggregatorColumn = requiredColumn(groups, [request.aggregator]);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const modifierOrderColumn = requiredColumn(modifiers, ['Orden', 'Posicion']);
  const modifierAggregatorColumn = requiredColumn(modifiers, [request.aggregator]);

  const selection = selectItemWithThreeGroups({
    items,
    categories,
    groups,
    modifiers,
    itemColumn,
    categoryItemColumn,
    categoryNameColumn,
    groupIdColumn,
    groupNameColumn,
    groupOrderColumn,
    groupAggregatorColumn,
    modifierItemColumn,
    modifierGroupColumn,
    modifierIdColumn,
    modifierNameColumn,
    modifierOrderColumn,
    modifierAggregatorColumn,
    aggregator: request.aggregator,
    minimumModifiersPerGroup: 2,
  });

  const orderedGroups = [...selection.groupRows].sort((left, right) => left.order - right.order);
  const reorderedGroupOrders = orderedGroups.map(group => group.order).reverse();
  const changes: ReorderChange[] = [];

  orderedGroups.forEach((group, index) => {
    const newOrder = reorderedGroupOrders[index];
    if (request.strategy === 'selective-update' && newOrder === group.order) return;
    changes.push(writeCell(groups, group.row, groupOrderColumn, newOrder, {
      entityType: 'modifierGroup',
      entityId: group.id,
      entityName: group.name,
    }));
  });

  const modifierRowById = new Map<string, number>();
  for (let row = 1; row < modifiers.rows.length; row += 1) {
    if (
      canonicalId(modifiers.rows[row][modifierItemColumn]) === selection.itemId
      && isEnabled(modifiers.rows[row][modifierAggregatorColumn])
    ) {
      modifierRowById.set(
        `${canonicalId(modifiers.rows[row][modifierGroupColumn])}::${canonicalId(modifiers.rows[row][modifierIdColumn])}`,
        row,
      );
    }
  }

  const expectedModifiersByGroup = new Map<string, CoreViewerModifierExpectation[]>();
  for (const [groupIndex, group] of orderedGroups.entries()) {
    const reorderedModifierOrders = group.modifiers.map(modifier => modifier.order).reverse();
    const expectedModifiers = group.modifiers.map((modifier, index) => {
      const shouldModify = request.strategy !== 'selective-update'
        || (groupIndex === 0 && (index === 0 || index === group.modifiers.length - 1));
      const expectedOrder = shouldModify ? reorderedModifierOrders[index] : modifier.order;
      const row = modifierRowById.get(`${group.id}::${modifier.id}`);
      if (row === undefined) {
        throw new Error(`No se encontro la fila del modificador ${modifier.id} del grupo ${group.id} para reordenar.`);
      }
      if (shouldModify && expectedOrder !== modifier.order) {
        changes.push(writeCell(modifiers, row, modifierOrderColumn, expectedOrder, {
          entityType: 'modifier',
          entityId: modifier.id,
          entityName: modifier.name,
          parentGroupId: group.id,
        }));
      }
      return {
        ...modifier,
        order: expectedOrder,
      };
    }).sort((left, right) => left.order - right.order);
    expectedModifiersByGroup.set(group.id, expectedModifiers);
  }

  xlsx.writeFile(workbook, inputPath, { compression: true, cellStyles: true });
  verifySavedTemplate(inputPath, originalSheetNames, originalRowCounts);

  const saved = xlsx.readFile(inputPath, { cellStyles: true });
  const savedGroups = requiredTable(saved, 'GrupoModificador');
  const savedModifiers = requiredTable(saved, 'Modificadores');
  const expectationGroups = orderedGroups
    .map((group, index) => {
      const savedGroupOrder = Number(savedGroups.rows[group.row][groupOrderColumn]);
      if (savedGroupOrder !== reorderedGroupOrders[index]) {
        throw new Error(
          `No se guardo el nuevo orden del grupo ${group.id}. Esperado: ${reorderedGroupOrders[index]}. Actual: ${savedGroupOrder}.`,
        );
      }

      const expectedModifiers = expectedModifiersByGroup.get(group.id) ?? [];
      for (const modifier of expectedModifiers) {
        const row = modifierRowById.get(`${group.id}::${modifier.id}`);
        const savedOrder = Number(savedModifiers.rows[row ?? -1]?.[modifierOrderColumn]);
        if (savedOrder !== modifier.order) {
          throw new Error(
            `No se guardo el nuevo orden del modificador ${modifier.id}. Esperado: ${modifier.order}. Actual: ${savedOrder}.`,
          );
        }
      }

      return {
        id: group.id,
        name: group.name,
        previousOrder: group.order,
        expectedOrder: reorderedGroupOrders[index],
        modifiers: expectedModifiers,
      };
    })
    .sort((left, right) => left.expectedOrder - right.expectedOrder);

  return {
    sourcePath,
    inputPath,
    outputPath: inputPath,
    changes,
    expectation: {
      inputPath,
      itemId: selection.itemId,
      itemName: displayValue(items.rows[selection.itemRow][itemNameColumn]),
      itemDescription: displayValue(items.rows[selection.itemRow][itemDescriptionColumn]),
      categoryName: selection.categoryName,
      groups: expectationGroups,
    },
  };
}


export function readGroupsAndModifiersExpectation(
  inputPath: string,
  aggregator: string,
): ReorderedGroupsExpectation {
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const items = requiredTable(workbook, 'Items');
  const categories = requiredTable(workbook, 'Categorias');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const itemDescriptionColumn = requiredColumn(items, ['Descripcion']);
  const selection = selectItemWithThreeGroups({
    items,
    categories,
    groups,
    modifiers,
    itemColumn,
    categoryItemColumn: requiredColumn(categories, ['Item']),
    categoryNameColumn: requiredColumn(categories, ['Categoria', 'Nombre Categoria']),
    groupIdColumn: requiredColumn(groups, ['Grupo Modificador']),
    groupNameColumn: requiredColumn(groups, ['Nombre Comercial']),
    groupOrderColumn: requiredColumn(groups, ['Orden', 'Posicion']),
    groupAggregatorColumn: requiredColumn(groups, [aggregator]),
    modifierItemColumn: requiredColumn(modifiers, ['Item']),
    modifierGroupColumn: requiredColumn(modifiers, ['Grupo Modificador']),
    modifierIdColumn: requiredColumn(modifiers, ['Modificador']),
    modifierNameColumn: requiredColumn(modifiers, ['Nombre Comercial Modificador']),
    modifierOrderColumn: requiredColumn(modifiers, ['Orden', 'Posicion']),
    modifierAggregatorColumn: requiredColumn(modifiers, [aggregator]),
    aggregator,
    minimumModifiersPerGroup: 2,
  });

  return {
    inputPath,
    itemId: selection.itemId,
    itemName: displayValue(items.rows[selection.itemRow][itemNameColumn]),
    itemDescription: displayValue(items.rows[selection.itemRow][itemDescriptionColumn]),
    categoryName: selection.categoryName,
    groups: selection.groupRows
      .map(group => ({
        id: group.id,
        name: group.name,
        previousOrder: group.order,
        expectedOrder: group.order,
        modifiers: [...group.modifiers].sort((left, right) => left.order - right.order),
      }))
      .sort((left, right) => left.expectedOrder - right.expectedOrder),
  };
}

function selectItemWithThreeGroups(input: {
  items: SheetTable;
  categories: SheetTable;
  groups: SheetTable;
  modifiers: SheetTable;
  itemColumn: number;
  categoryItemColumn: number;
  categoryNameColumn: number;
  groupIdColumn: number;
  groupNameColumn: number;
  groupOrderColumn: number;
  groupAggregatorColumn: number;
  modifierItemColumn: number;
  modifierGroupColumn: number;
  modifierIdColumn: number;
  modifierNameColumn: number;
  modifierOrderColumn: number;
  modifierAggregatorColumn: number;
  aggregator: string;
  minimumModifiersPerGroup?: number;
}): GroupSelection {
  const itemRows = new Map(
    input.items.rows.slice(1)
      .map((row, index) => [canonicalId(row[input.itemColumn]), index + 1] as const)
      .filter(([itemId]) => itemId),
  );
  const categoryByItem = new Map<string, string>();
  for (const row of input.categories.rows.slice(1)) {
    const itemId = canonicalId(row[input.categoryItemColumn]);
    const categoryName = displayValue(row[input.categoryNameColumn]);
    if (itemId && categoryName && !categoryByItem.has(itemId)) {
      categoryByItem.set(itemId, categoryName);
    }
  }

  const groupById = new Map<string, { row: number; id: string; name: string; order: number }>();
  for (let row = 1; row < input.groups.rows.length; row += 1) {
    if (!isEnabled(input.groups.rows[row][input.groupAggregatorColumn])) continue;
    const id = canonicalId(input.groups.rows[row][input.groupIdColumn]);
    const name = displayValue(input.groups.rows[row][input.groupNameColumn]);
    const order = Number(input.groups.rows[row][input.groupOrderColumn]);
    if (id && name && Number.isFinite(order)) {
      groupById.set(id, { row, id, name, order });
    }
  }

  const modifiersByItemGroup = new Map<string, Array<CoreViewerModifierExpectation & { groupDisplayName: string }>>();
  for (const row of input.modifiers.rows.slice(1)) {
    if (!isEnabled(row[input.modifierAggregatorColumn])) continue;
    const itemId = canonicalId(row[input.modifierItemColumn]);
    const groupId = canonicalId(row[input.modifierGroupColumn]);
    const modifier = {
      id: canonicalId(row[input.modifierIdColumn]),
      name: displayValue(row[input.modifierNameColumn]),
      order: Number(row[input.modifierOrderColumn]),
      groupDisplayName: displayValue(row[input.modifierGroupColumn + 1]),
    };
    if (!itemId || !groupId || !modifier.id || !modifier.name || !Number.isFinite(modifier.order)) continue;
    const key = `${itemId}::${groupId}`;
    modifiersByItemGroup.set(key, [...(modifiersByItemGroup.get(key) ?? []), modifier]);
  }

  for (const [itemId, itemRow] of itemRows) {
    const categoryName = categoryByItem.get(itemId);
    if (!categoryName) continue;

    const minimumModifiersPerGroup = input.minimumModifiersPerGroup ?? 1;
    const relatedGroups = [...groupById.values()]
      .map(group => {
        const modifiers = (modifiersByItemGroup.get(`${itemId}::${group.id}`) ?? [])
          .sort((left, right) => left.order - right.order);
        return {
          ...group,
          name: visualGroupName(group.name, modifiers[0]?.groupDisplayName ?? group.name),
          modifiers,
        };
      })
      .filter(group =>
        group.modifiers.length >= minimumModifiersPerGroup
        && hasUniqueModifierOrders(group.modifiers)
        && !group.modifiers.some(modifier => modifier.name.startsWith('AUTO_')))
      .sort((left, right) => left.order - right.order);

    const visuallyStableGroups = relatedGroups.filter(group => !/^Adicionales$/i.test(group.name));
    const selectedGroups = visuallyStableGroups.length >= 3 ? visuallyStableGroups : relatedGroups;

    if (selectedGroups.length >= 3) {
      return {
        itemId,
        itemRow,
        categoryName,
        groupRows: selectedGroups.slice(0, 3),
      };
    }
  }

  throw new Error(
    `No se encontro un item con categoria no vacia, al menos 3 grupos modificadores y al menos un modificador por grupo habilitados para ${input.aggregator}.`,
  );
}

function requiredTable(workbook: WorkBook, expectedName: string): SheetTable {
  const name = workbook.SheetNames.find(candidate => normalize(candidate) === normalize(expectedName));
  if (!name) {
    throw new Error(`La plantilla no contiene la hoja obligatoria ${expectedName}.`);
  }

  const sheet = workbook.Sheets[name];
  const rows = sheetRows(sheet);
  return { name, sheet, rows, headers: rows[0] ?? [] };
}

function sheetRows(sheet: WorkSheet | undefined): unknown[][] {
  if (!sheet) return [];
  return xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: true,
    raw: true,
  });
}

function requiredColumn(table: SheetTable, aliases: string[]): number {
  const normalizedAliases = aliases.map(normalize);
  const index = table.headers.findIndex(header => normalizedAliases.includes(normalize(header)));
  if (index < 0) {
    throw new Error(
      `La hoja ${table.name} no contiene la columna ${aliases.join(' o ')}. Encabezados: ${table.headers.filter(hasValue).join(', ')}.`,
    );
  }
  return index;
}

function writeCell(
  table: SheetTable,
  row: number,
  column: number,
  newValue: string | number,
  entity: Pick<ReorderChange, 'entityType' | 'entityId' | 'entityName'>
    & Partial<Pick<ReorderChange, 'parentGroupId'>>,
): ReorderChange {
  const previousValue = table.rows[row][column];
  const cell = xlsx.utils.encode_cell({ r: row, c: column });
  xlsx.utils.sheet_add_aoa(table.sheet, [[newValue]], { origin: { r: row, c: column } });
  table.rows[row][column] = newValue;
  return {
    sheet: table.name,
    cell,
    field: displayValue(table.headers[column]),
    ...entity,
    previousValue: displayValue(previousValue),
    newValue: displayValue(newValue),
  };
}

function verifySavedTemplate(
  outputPath: string,
  expectedSheetNames: string[],
  expectedRowCounts: Record<string, number>,
): void {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`No se genero la plantilla editada ${outputPath}.`);
  }

  const saved = xlsx.readFile(outputPath, { cellStyles: true });
  if (saved.SheetNames.join('|') !== expectedSheetNames.join('|')) {
    throw new Error('La plantilla editada no conserva las hojas y su orden original.');
  }

  for (const sheetName of expectedSheetNames) {
    const actualRows = sheetRows(saved.Sheets[sheetName]).length;
    if (actualRows !== expectedRowCounts[sheetName]) {
      throw new Error(
        `La hoja ${sheetName} cambio de ${expectedRowCounts[sheetName]} a ${actualRows} filas al guardar la plantilla.`,
      );
    }
  }
}

function isEnabled(value: unknown): boolean {
  return displayValue(value).trim() === '*';
}

function hasUniqueModifierOrders(modifiers: CoreViewerModifierExpectation[]): boolean {
  const orders = modifiers.map(modifier => modifier.order);
  return new Set(orders).size === orders.length;
}

function visualGroupName(commercialName: string, relationshipName: string): string {
  if (!/^Cambia tu\b/i.test(commercialName)) {
    return commercialName;
  }

  if (/leche/i.test(relationshipName)) {
    return 'Tipo de leche';
  }

  if (/caf[eé]/i.test(relationshipName)) {
    return 'Tipo de grano de café';
  }

  return relationshipName || commercialName;
}

function normalize(value: unknown): string {
  return displayValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function canonicalId(value: unknown): string {
  const text = displayValue(value);
  return /^-?\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
}

function displayValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}
