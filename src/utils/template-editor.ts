import fs from 'fs';
import xlsx, { type WorkBook, type WorkSheet } from 'xlsx';
import {
  copyExcelFromPreviousCase,
  type ArtifactScope,
} from './case-artifact-manager';

export type TemplateEditRequest = {
  caseId: string;
  sourceCaseId: string;
  aggregator: string;
  artifactScope: ArtifactScope;
};

export type CellChange = {
  sheet: string;
  cell: string;
  field: string;
  previousValue: string;
  newValue: string;
};

export type TemplateEditResult = {
  sourcePath: string;
  inputPath: string;
  outputPath: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  groupId: string;
  modifierIds: string[];
  changes: CellChange[];
};

type CellSnapshot = {
  sheet: string;
  cell: string;
  value: string;
};

type SheetTable = {
  name: string;
  sheet: WorkSheet;
  rows: unknown[][];
  headers: unknown[];
};

const requiredSheets = ['Items', 'Categorias', 'GrupoModificador', 'Modificadores'] as const;

export function editDownloadedTemplate(request: TemplateEditRequest): TemplateEditResult {
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
  ensureTablesHaveData([items, categories, groups, modifiers], inputPath);

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const categoryItemColumn = requiredColumn(categories, ['Item']);
  const categoryNameColumn = requiredColumn(categories, ['Categoria', 'Nombre Categoria']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupDescriptionColumn = requiredColumn(groups, ['Descripcion']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const groupAggregatorColumn = requiredColumn(groups, [request.aggregator]);
  const modifierAggregatorColumn = requiredColumn(modifiers, [request.aggregator]);

  const selection = selectRelatedRows(
    items,
    categories,
    groups,
    modifiers,
    itemColumn,
    categoryItemColumn,
    categoryNameColumn,
    groupIdColumn,
    modifierItemColumn,
    modifierGroupColumn,
    groupAggregatorColumn,
    modifierAggregatorColumn,
    request.aggregator,
  );
  const currentDate = formatDate(new Date());
  const marker = `${request.caseId}_${currentDate}`;
  const changes: CellChange[] = [];
  const unchangedCells = [
    ...snapshotUnchangedRowCells(
      items,
      selection.itemRow,
      new Set([itemNameColumn]),
    ),
    ...snapshotUnchangedRowCells(
      groups,
      selection.groupRow,
      new Set([groupNameColumn, groupDescriptionColumn]),
    ),
    ...selection.modifierRows.flatMap(row =>
      snapshotUnchangedRowCells(modifiers, row, new Set([modifierNameColumn]))),
  ];

  const previousItemName = displayValue(items.rows[selection.itemRow][itemNameColumn]).trim();
  changeCell(items, selection.itemRow, itemNameColumn, `${previousItemName}_${currentDate}`, changes);
  changeCell(groups, selection.groupRow, groupNameColumn, `AUTO_${marker}`, changes);
  changeCell(groups, selection.groupRow, groupDescriptionColumn, `Descripcion automatizada ${marker}`, changes);

  selection.modifierRows.forEach((row, index) => {
    changeCell(modifiers, row, modifierNameColumn, `AUTO_${marker}_MOD_${index + 1}`, changes);
  });

  const outputPath = inputPath;
  xlsx.writeFile(workbook, outputPath, { compression: true, cellStyles: true });

  verifyEditedTemplate(outputPath, originalSheetNames, originalRowCounts, changes, unchangedCells);

  return {
    sourcePath,
    inputPath,
    outputPath,
    itemId: canonicalId(selection.itemId),
    itemName: displayValue(items.rows[selection.itemRow][itemNameColumn]).trim(),
    categoryName: selection.categoryName,
    groupId: canonicalId(selection.groupId),
    modifierIds: selection.modifierRows.map(row => canonicalId(modifiers.rows[row][modifierIdColumn])),
    changes,
  };
}

function requiredTable(workbook: WorkBook, expectedName: string): SheetTable {
  const name = workbook.SheetNames.find(candidate => normalize(candidate) === normalize(expectedName));
  if (!name) {
    throw new Error(
      `La plantilla no contiene la hoja obligatoria ${expectedName}. Hojas encontradas: ${workbook.SheetNames.join(', ')}.`,
    );
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

function ensureTablesHaveData(tables: SheetTable[], inputPath: string): void {
  const emptySheets = tables
    .filter(table => !table.rows.slice(1).some(row => row.some(value => hasValue(value))))
    .map(table => table.name);

  if (emptySheets.length > 0) {
    throw new Error(
      `La plantilla ${inputPath} no contiene registros editables. Hojas que solo contienen encabezados: ${emptySheets.join(', ')}.`,
    );
  }
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

function selectRelatedRows(
  items: SheetTable,
  categories: SheetTable,
  groups: SheetTable,
  modifiers: SheetTable,
  itemColumn: number,
  categoryItemColumn: number,
  categoryNameColumn: number,
  groupIdColumn: number,
  modifierItemColumn: number,
  modifierGroupColumn: number,
  groupAggregatorColumn: number,
  modifierAggregatorColumn: number,
  aggregator: string,
): {
  itemId: unknown;
  itemRow: number;
  categoryName: string;
  groupId: unknown;
  groupRow: number;
  modifierRows: number[];
} {
  const itemRows = new Map(
    items.rows.slice(1)
      .map((row, index) => [canonicalId(row[itemColumn]), index + 1] as const)
      .filter(([itemId]) => itemId),
  );
  const categoryByItem = new Map<string, string>();
  for (const row of categories.rows.slice(1)) {
    const itemId = canonicalId(row[categoryItemColumn]);
    const categoryName = displayValue(row[categoryNameColumn]).trim();
    if (itemId && categoryName && !categoryByItem.has(itemId)) {
      categoryByItem.set(itemId, categoryName);
    }
  }

  for (let groupRow = 1; groupRow < groups.rows.length; groupRow += 1) {
    const groupId = groups.rows[groupRow][groupIdColumn];
    if (!hasValue(groupId) || !isEnabled(groups.rows[groupRow][groupAggregatorColumn])) continue;

    const candidateItemIds = new Set(
      modifiers.rows.slice(1)
        .filter(row => canonicalId(row[modifierGroupColumn]) === canonicalId(groupId))
        .map(row => canonicalId(row[modifierItemColumn]))
        .filter(Boolean),
    );

    for (const itemId of candidateItemIds) {
      const itemRow = itemRows.get(itemId);
      const categoryName = categoryByItem.get(itemId);
      if (itemRow === undefined || !categoryName) continue;

      const relatedModifierRows = modifiers.rows
        .map((row, index) => ({ row, index }))
        .filter(({ row, index }) =>
          index > 0
          && canonicalId(row[modifierGroupColumn]) === canonicalId(groupId)
          && canonicalId(row[modifierItemColumn]) === itemId
          && isEnabled(row[modifierAggregatorColumn]))
        .map(({ index }) => index);
      if (relatedModifierRows.length < 2) continue;

      return {
        itemId,
        itemRow,
        categoryName,
        groupId,
        groupRow,
        modifierRows: relatedModifierRows.slice(0, 2),
      };
    }
  }

  throw new Error(
    `No se encontro un item que exista en Items, tenga una Categoria no vacia y este relacionado con un grupo modificador y al menos dos modificadores habilitados para ${aggregator}.`,
  );
}

function isEnabled(value: unknown): boolean {
  return displayValue(value).trim() === '*';
}

function formatDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
}

function changeCell(
  table: SheetTable,
  row: number,
  column: number,
  newValue: string | number,
  changes: CellChange[],
): void {
  const previousValue = table.rows[row][column];
  const cell = xlsx.utils.encode_cell({ r: row, c: column });
  xlsx.utils.sheet_add_aoa(table.sheet, [[newValue]], { origin: { r: row, c: column } });
  table.rows[row][column] = newValue;
  changes.push({
    sheet: table.name,
    cell,
    field: String(table.headers[column]),
    previousValue: displayValue(previousValue),
    newValue: displayValue(newValue),
  });
}

function snapshotUnchangedRowCells(
  table: SheetTable,
  row: number,
  changedColumns: ReadonlySet<number>,
): CellSnapshot[] {
  return table.headers.flatMap((_, column) => {
    if (changedColumns.has(column)) return [];
    return [{
      sheet: table.name,
      cell: xlsx.utils.encode_cell({ r: row, c: column }),
      value: displayValue(table.rows[row][column]),
    }];
  });
}

function verifyEditedTemplate(
  outputPath: string,
  expectedSheetNames: string[],
  expectedRowCounts: Record<string, number>,
  changes: CellChange[],
  unchangedCells: CellSnapshot[],
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

  for (const change of changes) {
    const actual = saved.Sheets[change.sheet]?.[change.cell]?.v;
    if (displayValue(actual) !== change.newValue) {
      throw new Error(
        `No se conservo el cambio ${change.sheet}!${change.cell}. Esperado: ${change.newValue}. Actual: ${displayValue(actual)}.`,
      );
    }
  }

  for (const snapshot of unchangedCells) {
    const actual = saved.Sheets[snapshot.sheet]?.[snapshot.cell]?.v;
    if (displayValue(actual) !== snapshot.value) {
      throw new Error(
        `La celda no editable ${snapshot.sheet}!${snapshot.cell} cambio. Esperado: ${snapshot.value}. Actual: ${displayValue(actual)}.`,
      );
    }
  }
}

function normalize(value: unknown): string {
  return displayValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function canonicalId(value: unknown): string {
  const text = displayValue(value).trim();
  return /^-?\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
}

function displayValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

