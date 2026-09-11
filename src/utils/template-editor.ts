import fs from 'fs';
import xlsx, { type WorkBook, type WorkSheet } from 'xlsx';
import { copyExcelFromPreviousCase, getLatestExcelForCase } from './case-artifact-manager';

export type TemplateEditRequest = {
  caseId: string;
  sourceCaseId: string;
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

const requiredSheets = ['Items', 'GrupoModificador', 'Modificadores'] as const;

export function editDownloadedTemplate(request: TemplateEditRequest): TemplateEditResult {
  const { sourcePath, targetPath: inputPath } = copyExcelFromPreviousCase({
    fromCase: request.sourceCaseId,
    toCase: request.caseId,
  });
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const originalSheetNames = [...workbook.SheetNames];
  const originalRowCounts = Object.fromEntries(
    originalSheetNames.map(name => [name, sheetRows(workbook.Sheets[name]).length]),
  );

  const items = requiredTable(workbook, 'Items');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');
  ensureTablesHaveData([items, groups, modifiers], inputPath);

  const itemColumn = requiredColumn(items, ['Item']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupDescriptionColumn = requiredColumn(groups, ['Descripcion']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);

  const selection = selectRelatedRows(
    items,
    groups,
    modifiers,
    itemColumn,
    groupIdColumn,
    modifierItemColumn,
    modifierGroupColumn,
  );
  const marker = `${request.caseId}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const changes: CellChange[] = [];
  const unchangedCells = [
    ...snapshotUnchangedRowCells(
      groups,
      selection.groupRow,
      new Set([groupNameColumn, groupDescriptionColumn]),
    ),
    ...selection.modifierRows.flatMap(row =>
      snapshotUnchangedRowCells(modifiers, row, new Set([modifierNameColumn]))),
  ];

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
    groupId: canonicalId(selection.groupId),
    modifierIds: selection.modifierRows.map(row => canonicalId(modifiers.rows[row][modifierIdColumn])),
    changes,
  };
}

export function findEditedTemplate(caseId: string): string {
  return getLatestExcelForCase(caseId);
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
  groups: SheetTable,
  modifiers: SheetTable,
  itemColumn: number,
  groupIdColumn: number,
  modifierItemColumn: number,
  modifierGroupColumn: number,
): { itemId: unknown; groupId: unknown; groupRow: number; modifierRows: number[] } {
  const itemIds = new Set(
    items.rows.slice(1).map(row => canonicalId(row[itemColumn])).filter(Boolean),
  );

  for (let groupRow = 1; groupRow < groups.rows.length; groupRow += 1) {
    const groupId = groups.rows[groupRow][groupIdColumn];
    if (!hasValue(groupId)) continue;

    const relatedModifierRows: number[] = [];
    for (let modifierRow = 1; modifierRow < modifiers.rows.length; modifierRow += 1) {
      if (canonicalId(modifiers.rows[modifierRow][modifierGroupColumn]) === canonicalId(groupId)) {
        relatedModifierRows.push(modifierRow);
      }
    }

    if (relatedModifierRows.length < 2) continue;
    const itemId = modifiers.rows[relatedModifierRows[0]][modifierItemColumn];
    if (!itemIds.has(canonicalId(itemId))) continue;

    return {
      itemId,
      groupId,
      groupRow,
      modifierRows: relatedModifierRows.slice(0, 2),
    };
  }

  throw new Error(
    'No se encontro un producto con un grupo modificador relacionado y al menos dos modificadores editables.',
  );
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

