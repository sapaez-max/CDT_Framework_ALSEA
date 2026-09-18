import path from 'path';

export type ModificationEvidenceContext = {
  country: string;
  brand: string;
  branch: string;
  aggregator: string;
  menuType: string;
};

export type ModificationEntityRow = {
  id?: string;
  name?: string;
  nameBefore?: string;
  nameAfter?: string;
  descriptionBefore?: string;
  descriptionAfter?: string;
  orderBefore?: string | number;
  orderAfter?: string | number;
};

export type ModificationEvidenceInput = {
  caseId: string;
  title?: string;
  context: ModificationEvidenceContext;
  sourceFile: string;
  resultFile: string;
  item?: ModificationEntityRow;
  category?: string;
  modifierGroups?: ModificationEntityRow[];
  modifiers?: ModificationEntityRow[];
};

type Column = {
  key: keyof ModificationEntityRow;
  label: string;
};

const itemColumns: Column[] = [
  { key: 'id', label: 'Item ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'nameBefore', label: 'Nombre anterior' },
  { key: 'nameAfter', label: 'Nombre nuevo' },
];

const groupColumns: Column[] = [
  { key: 'id', label: 'Grupo ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'nameBefore', label: 'Nombre anterior' },
  { key: 'nameAfter', label: 'Nombre nuevo' },
  { key: 'descriptionBefore', label: 'Descripcion anterior' },
  { key: 'descriptionAfter', label: 'Descripcion nueva' },
  { key: 'orderBefore', label: 'Orden anterior' },
  { key: 'orderAfter', label: 'Orden nuevo' },
];

const modifierColumns: Column[] = [
  { key: 'id', label: 'Modifier ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'nameBefore', label: 'Nombre anterior' },
  { key: 'nameAfter', label: 'Nombre nuevo' },
  { key: 'orderBefore', label: 'Orden anterior' },
  { key: 'orderAfter', label: 'Orden nuevo' },
];

export function buildModificationEvidenceHtml(input: ModificationEvidenceInput): string {
  const title = `${input.caseId} - Resumen de modificaciones`;
  const item = input.item
    ? [input.item.id, input.item.nameAfter ?? input.item.name].filter(Boolean).join(' - ')
    : 'No disponible';

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1f2933; background: #fff; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    h2 { margin: 26px 0 10px; font-size: 16px; }
    .subtitle { margin: 0 0 18px; color: #52606d; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f0f4f8; }
    .meta th { width: 220px; }
    .status { font-weight: 700; white-space: nowrap; }
    .changed { background: #fff7d6; }
    .muted { color: #52606d; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">${escapeHtml(input.title ?? 'Evidencia visual tabular de cambios en plantilla Excel')}</p>

  <h2>Contexto</h2>
  <table class="meta">
    <tbody>
      <tr><th>Caso</th><td>${escapeHtml(input.caseId)}</td></tr>
      <tr><th>Pais</th><td>${escapeHtml(input.context.country)}</td></tr>
      <tr><th>Marca</th><td>${escapeHtml(input.context.brand)}</td></tr>
      <tr><th>Sucursal</th><td>${escapeHtml(input.context.branch)}</td></tr>
      <tr><th>Agregador</th><td>${escapeHtml(input.context.aggregator)}</td></tr>
      <tr><th>Tipo de menu</th><td>${escapeHtml(input.context.menuType)}</td></tr>
      <tr><th>Item</th><td>${escapeHtml(item)}</td></tr>
      <tr><th>Categoria</th><td>${escapeHtml(input.category ?? 'No disponible')}</td></tr>
    </tbody>
  </table>

  ${entityTable('Item modificado', input.item ? [input.item] : [], itemColumns)}
  ${entityTable('Grupos modificadores', input.modifierGroups ?? [], groupColumns)}
  ${entityTable('Modificadores', input.modifiers ?? [], modifierColumns)}

  <h2>Archivos</h2>
  <table class="meta">
    <tbody>
      <tr><th>Archivo origen</th><td><code>${escapeHtml(input.sourceFile)}</code></td></tr>
      <tr><th>Archivo resultado</th><td><code>${escapeHtml(input.resultFile)}</code></td></tr>
      <tr><th>Archivo origen nombre</th><td>${escapeHtml(path.basename(input.sourceFile))}</td></tr>
      <tr><th>Archivo resultado nombre</th><td>${escapeHtml(path.basename(input.resultFile))}</td></tr>
    </tbody>
  </table>
</body>
</html>`;
}

function entityTable(title: string, rows: ModificationEntityRow[], baseColumns: Column[]): string {
  if (rows.length === 0) {
    return `<h2>${escapeHtml(title)}</h2><p class="muted">Sin cambios registrados para esta entidad.</p>`;
  }

  const columns = baseColumns.filter(column => rows.some(row => hasValue(row[column.key])));
  const header = [...columns.map(column => `<th>${escapeHtml(column.label)}</th>`), '<th>Estado</th>'].join('');
  const body = rows.map(row => {
    const changed = rowChanged(row);
    const cells = columns.map(column => {
      const value = formatValue(row[column.key]);
      const changedClass = isChangedColumn(row, column.key) ? ' class="changed"' : '';
      return `<td${changedClass}>${escapeHtml(value)}</td>`;
    }).join('');
    return `<tr>${cells}<td class="status">${changed ? 'MODIFICADO' : 'SIN CAMBIO'}</td></tr>`;
  }).join('\n');

  return `<h2>${escapeHtml(title)}</h2>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>
      ${body}
    </tbody>
  </table>`;
}

function isChangedColumn(row: ModificationEntityRow, key: keyof ModificationEntityRow): boolean {
  if (key === 'nameAfter') return hasValue(row.nameBefore) && row.nameBefore !== row.nameAfter;
  if (key === 'descriptionAfter') return hasValue(row.descriptionBefore) && row.descriptionBefore !== row.descriptionAfter;
  if (key === 'orderAfter') return hasValue(row.orderBefore) && String(row.orderBefore) !== String(row.orderAfter);
  return false;
}

function rowChanged(row: ModificationEntityRow): boolean {
  return (
    (hasValue(row.nameBefore) && row.nameBefore !== row.nameAfter)
    || (hasValue(row.descriptionBefore) && row.descriptionBefore !== row.descriptionAfter)
    || (hasValue(row.orderBefore) && String(row.orderBefore) !== String(row.orderAfter))
  );
}

function formatValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value) !== '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
