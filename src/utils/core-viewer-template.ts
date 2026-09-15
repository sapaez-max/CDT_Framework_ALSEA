import xlsx, { type WorkBook, type WorkSheet } from 'xlsx';

export type CoreViewerModifierExpectation = {
  id: string;
  name: string;
  order: number;
};

export type CoreViewerTemplateExpectation = {
  inputPath: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemPrices: number[];
  itemDaypart?: string;
  categoryName: string;
  groupId: string;
  groupName: string;
  groupDescription: string;
  groupOrder: number;
  modifiers: CoreViewerModifierExpectation[];
};

type SheetTable = {
  name: string;
  sheet: WorkSheet;
  rows: unknown[][];
  headers: unknown[];
};

export function readCoreViewerExpectation(inputPath: string): CoreViewerTemplateExpectation {
  const workbook = xlsx.readFile(inputPath, { cellStyles: true });
  const items = requiredTable(workbook, 'Items');
  const groups = requiredTable(workbook, 'GrupoModificador');
  const modifiers = requiredTable(workbook, 'Modificadores');
  const categories = requiredTable(workbook, 'Categorias');

  const itemColumn = requiredColumn(items, ['Item']);
  const itemNameColumn = requiredColumn(items, ['Nombre Comercial']);
  const itemDescriptionColumn = requiredColumn(items, ['Descripcion']);
  const itemPriceColumns = items.headers
    .map((header, index) => ({ header: normalize(header), index }))
    .filter(({ header }) => /^PRICELEVEL\d+$/.test(header))
    .map(({ index }) => index);
  const itemDaypartColumn = optionalColumn(items, ['Daypart']);
  const categoryItemColumn = requiredColumn(categories, ['Item']);
  const categoryNameColumn = requiredColumn(categories, ['Categoria', 'Nombre Categoria']);
  const groupIdColumn = requiredColumn(groups, ['Grupo Modificador']);
  const groupNameColumn = requiredColumn(groups, ['Nombre Comercial']);
  const groupDescriptionColumn = requiredColumn(groups, ['Descripcion']);
  const groupOrderColumn = requiredColumn(groups, ['Orden', 'Posicion']);
  const modifierItemColumn = requiredColumn(modifiers, ['Item']);
  const modifierGroupColumn = requiredColumn(modifiers, ['Grupo Modificador']);
  const modifierIdColumn = requiredColumn(modifiers, ['Modificador']);
  const modifierNameColumn = requiredColumn(modifiers, ['Nombre Comercial Modificador']);
  const modifierOrderColumn = requiredColumn(modifiers, ['Orden', 'Posicion']);

  const editedGroupRow = findLastAutoGroupRow(groups.rows, groupNameColumn);

  if (editedGroupRow < 0) {
    throw new Error(`No se encontro un grupo modificador editado con marcador AUTO_ en ${inputPath}.`);
  }

  const groupId = canonicalId(groups.rows[editedGroupRow][groupIdColumn]);
  const relatedModifierRows = modifiers.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) =>
      index > 0
      && canonicalId(row[modifierGroupColumn]) === groupId
      && displayValue(row[modifierNameColumn]).startsWith('AUTO_'));

  if (relatedModifierRows.length < 2) {
    throw new Error(
      `No se encontraron al menos dos modificadores editados con marcador AUTO_ para el grupo ${groupId} en ${inputPath}.`,
    );
  }

  const itemId = canonicalId(relatedModifierRows[0].row[modifierItemColumn]);
  const itemRow = items.rows.find((row, index) => index > 0 && canonicalId(row[itemColumn]) === itemId);
  if (!itemRow) {
    throw new Error(`No se encontro el item ${itemId} en la hoja Items de ${inputPath}.`);
  }

  const categoryRow = categories.rows.find((row, index) =>
    index > 0
    && canonicalId(row[categoryItemColumn]) === itemId
    && hasValue(row[categoryNameColumn]));
  if (!categoryRow) {
    throw new Error(
      `No se encontro una Categoria no vacia para el item ${itemId} en ${inputPath}.`,
    );
  }

  return {
    inputPath,
    itemId,
    itemName: displayValue(itemRow[itemNameColumn]),
    itemDescription: displayValue(itemRow[itemDescriptionColumn]),
    itemPrices: uniqueNumbers(itemPriceColumns.map(column => itemRow[column])),
    itemDaypart: itemDaypartColumn >= 0
      ? displayValue(itemRow[itemDaypartColumn]) || undefined
      : undefined,
    categoryName: displayValue(categoryRow[categoryNameColumn]),
    groupId,
    groupName: displayValue(groups.rows[editedGroupRow][groupNameColumn]),
    groupDescription: displayValue(groups.rows[editedGroupRow][groupDescriptionColumn]),
    groupOrder: Number(groups.rows[editedGroupRow][groupOrderColumn]),
    modifiers: relatedModifierRows
      .map(({ row }) => ({
        id: canonicalId(row[modifierIdColumn]),
        name: displayValue(row[modifierNameColumn]),
        order: Number(row[modifierOrderColumn]),
      }))
      .sort((left, right) => left.order - right.order),
  };
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

function optionalColumn(table: SheetTable, aliases: string[]): number {
  const normalizedAliases = aliases.map(normalize);
  return table.headers.findIndex(header => normalizedAliases.includes(normalize(header)));
}

function uniqueNumbers(values: unknown[]): number[] {
  const numbers = values
    .map(value => Number(displayValue(value).replace(/[$,]/g, '')))
    .filter(value => Number.isFinite(value));

  return [...new Set(numbers)];
}

function findLastAutoGroupRow(rows: unknown[][], groupNameColumn: number): number {
  for (let i = rows.length - 1; i >= 1; i--) {
    if (displayValue(rows[i][groupNameColumn]).startsWith('AUTO_')) return i;
  }
  return -1;
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
  return value === null || value === undefined ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}
