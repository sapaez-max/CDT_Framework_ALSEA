import path from 'path';

export type JsonComparisonRow = {
  entity: string;
  expectedIdentifier: string;
  actualIdentifier: string;
  expectedName: string;
  actualName: string;
  expectedPosition: string;
  actualPosition: string;
  passed: boolean;
};

export type JsonOrderComparison = {
  expected: string;
  actual: string;
  passed: boolean;
};

type JsonComparisonInput = {
  caseId: string;
  title: string;
  context: {
    country: string | string[];
    brand: string | string[];
    branch: string | string[];
    aggregator: string | string[];
    menuType?: string | string[];
  };
  sourceFile: string;
  rows: JsonComparisonRow[];
  modifierOrder: JsonOrderComparison;
};

export function buildJsonComparisonHtml(input: JsonComparisonInput): string {
  const contextRows = [
    ['Caso', input.caseId],
    ['Escenario', input.title],
    ['País', formatValue(input.context.country)],
    ['Marca', formatValue(input.context.brand)],
    ['Sucursal', formatValue(input.context.branch)],
    ['Agregador', formatValue(input.context.aggregator)],
    ['Tipo de menú', formatValue(input.context.menuType)],
    ['Plantilla de referencia', path.basename(input.sourceFile)],
  ];

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Comparación de datos esperados y obtenidos en el JSON</title>
<style>
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
  h1 { color: #00556f; font-size: 22px; }
  h2 { color: #087da1; font-size: 17px; margin-top: 24px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #e8f6fb; }
  .comparison th:nth-child(1) { width: 12%; }
  .comparison th:nth-child(2), .comparison th:nth-child(3) { width: 11%; }
  .comparison th:nth-child(4), .comparison th:nth-child(5) { width: 20%; }
  .comparison th:nth-child(6), .comparison th:nth-child(7) { width: 8%; }
  .comparison th:last-child, .comparison td:last-child { width: 10%; white-space: nowrap; }
  .name { overflow-wrap: anywhere; }
  .passed { color: #137333; font-weight: 700; }
  .failed { color: #b91c1c; font-weight: 700; }
</style>
</head>
<body>
<h1>Comparación de datos esperados y obtenidos en el JSON</h1>
<h2>Contexto</h2>
${table(['Dato', 'Valor'], contextRows)}
<h2>Entidades validadas</h2>
${comparisonTable(input.rows)}
<h2>Orden de modificadores</h2>
${table(
    ['Esperado', 'Obtenido', 'Resultado'],
    [[
      input.modifierOrder.expected,
      input.modifierOrder.actual,
      resultLabel(input.modifierOrder.passed),
    ]],
    true,
  )}
</body>
</html>`;
}

function comparisonTable(rows: JsonComparisonRow[]): string {
  const headers = [
    'Entidad',
    'Identificador esperado',
    'Identificador obtenido',
    'Nombre esperado',
    'Nombre obtenido',
    'Posición esperada',
    'Posición obtenida',
    'Resultado',
  ];
  const head = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows.map(row => `<tr>
<td>${escapeHtml(row.entity)}</td>
<td>${escapeHtml(row.expectedIdentifier)}</td>
<td>${escapeHtml(row.actualIdentifier)}</td>
<td class="name">${escapeHtml(row.expectedName)}</td>
<td class="name">${escapeHtml(row.actualName)}</td>
<td>${escapeHtml(row.expectedPosition)}</td>
<td>${escapeHtml(row.actualPosition)}</td>
<td>${resultLabel(row.passed)}</td>
</tr>`).join('');
  return `<table class="comparison"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function resultLabel(passed: boolean): string {
  return `<span class="${passed ? 'passed' : 'failed'}">${passed ? 'Correcto' : 'No coincide'}</span>`;
}

function table(headers: string[], rows: string[][], allowHtml = false): string {
  const head = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows.map(row => `<tr>${row.map((cell, index) => {
    const value = allowHtml && index === row.length - 1 ? cell : escapeHtml(cell);
    return `<td>${value}</td>`;
  }).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function formatValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(' / ');
  return value ?? '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
