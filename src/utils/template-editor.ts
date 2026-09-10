import fs from 'fs';
import path from 'path';
import xlsx, { type WorkBook, type WorkSheet } from 'xlsx';

export type TemplateEditRequest = {
  caseId: string;
  sourceCaseId: string;
  aggregators: string[];
};

export type CellChange = {
  sheet: string;
  cell: string;
  field: string;
  previousValue: string;
  newValue: string;
};

export type TemplateEditResult = {
  inputPath: string;
  outputPath: string;
  itemId: string;
  groupId: string;
  modifierIds: string[];
  aggregator: string;
  changes: CellChange[];
};

type SheetTable = {
  name: string;
  sheet: WorkSheet;
  rows: unknown[][];
  headers: unknown[];
};

const requiredSheets = ['Items', 'GrupoModificador', 'Modificadores'] as const;

export function editDownloadedTemplate(request: TemplateEditRequest): TemplateEditResult {
  const inputPath = findDownloadedTemplate(request.sourceCaseId);
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
  const groupOrderColumn = requiredColumn(groups, ['Orden', 'Posicion']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const modifierOrderColumn = requiredColumn(modifiers, ['Orden', 'Posicion']);
  const aggregator = firstAvailableAggregator(request.aggregators, groups, modifiers);
  const groupAggregatorColumn = requiredColumn(groups, [aggregator]);
  const modifierAggregatorColumn = requiredColumn(modifiers, [aggregator]);

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

  changeCell(groups, selection.groupRow, groupNameColumn, `AUTO_${marker}`, changes);
  changeCell(groups, selection.groupRow, groupDescriptionColumn, `Descripcion automatizada ${marker}`, changes);
  changeCell(
    groups,
    selection.groupRow,
    groupOrderColumn,
    nextOrder(groups.rows[selection.groupRow][groupOrderColumn]),
    changes,
  );
  changeCell(groups, selection.groupRow, groupAggregatorColumn, '*', changes);

  const modifierPositions = nextModifierPositions(
    selection.modifierRows.map(row => modifiers.rows[row][modifierOrderColumn]),
  );
  selection.modifierRows.forEach((row, index) => {
    changeCell(modifiers, row, modifierNameColumn, `AUTO_${marker}_MOD_${index + 1}`, changes);
    changeCell(modifiers, row, modifierOrderColumn, modifierPositions[index], changes);
    changeCell(modifiers, row, modifierAggregatorColumn, '*', changes);
  });

  const outputDirectory = path.resolve('artifacts', 'edited', safeSegment(request.caseId));
  const parsedName = path.parse(inputPath);
  const outputPath = path.join(
    outputDirectory,
    `${parsedName.name}_EDITADO_${safeSegment(request.caseId)}${parsedName.ext}`,
  );
  fs.mkdirSync(outputDirectory, { recursive: true });
  xlsx.writeFile(workbook, outputPath, { compression: true, cellStyles: true });

  verifyEditedTemplate(outputPath, originalSheetNames, originalRowCounts, changes);

  return {
    inputPath,
    outputPath,
    itemId: canonicalId(selection.itemId),
    groupId: canonicalId(selection.groupId),
    modifierIds: selection.modifierRows.map(row => canonicalId(modifiers.rows[row][modifierIdColumn])),
    aggregator,
    changes,
  };
}

function findDownloadedTemplate(sourceCaseId: string): string {
  const directory = path.resolve('artifacts', 'downloads', safeSegment(sourceCaseId));
  if (!fs.existsSync(directory)) {
    throw new Error(
      `No existe la carpeta ${directory}. Debe ejecutarse ${sourceCaseId} antes de editar la plantilla.`,
    );
  }

  const files = fs.readdirSync(directory)
    .filter(file => /\.xlsx?$/i.test(file))
    .map(file => path.join(directory, file));

  if (files.length === 0) {
    throw new Error(
      `No se encontro un archivo .xls o .xlsx en ${directory}. Debe ejecutarse ${sourceCaseId} antes de editar la plantilla.`,
    );
  }

  if (files.length > 1) {
    throw new Error(
      `Se encontraron ${files.length} plantillas en ${directory}. Debe existir un unico archivo de entrada: ${files.map(file => path.basename(file)).join(', ')}.`,
    );
  }

  return files[0];
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

function firstAvailableAggregator(
  preferences: string[],
  groups: SheetTable,
  modifiers: SheetTable,
): string {
  const available = preferences.find(candidate =>
    groups.headers.some(header => normalize(header) === normalize(candidate))
    && modifiers.headers.some(header => normalize(header) === normalize(candidate)),
  );
  if (!available) {
    throw new Error(
      `Ninguno de los agregadores configurados (${preferences.join(', ')}) existe en GrupoModificador y Modificadores.`,
    );
  }
  return available;
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

function nextOrder(value: unknown): number {
  const current = Number(value);
  return Number.isFinite(current) && current >= 0 ? current + 1 : 1;
}

function nextModifierPositions(values: unknown[]): number[] {
  const numeric = values.map(Number);
  if (numeric.length === 2 && numeric.every(Number.isFinite) && numeric[0] !== numeric[1]) {
    return [numeric[1], numeric[0]];
  }
  const maximum = numeric.filter(Number.isFinite).reduce((max, value) => Math.max(max, value), 0);
  return [maximum + 1, maximum + 2];
}

function verifyEditedTemplate(
  outputPath: string,
  expectedSheetNames: string[],
  expectedRowCounts: Record<string, number>,
  changes: CellChange[],
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

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
