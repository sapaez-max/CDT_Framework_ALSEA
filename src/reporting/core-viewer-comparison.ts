import path from 'path';

export type CoreViewerComparisonRow = {
  entity: string;
  identifier?: string;
  field: string;
  expected: string;
  actual: string;
  passed: boolean;
};

type CoreViewerComparisonInput = {
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
  rows: CoreViewerComparisonRow[];
};

export function buildCoreViewerComparisonHtml(input: CoreViewerComparisonInput): string {
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
<title>Comparación de datos esperados y obtenidos en Visor CORE</title>
<style>
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
  h1 { color: #00556f; font-size: 22px; }
  h2 { color: #087da1; font-size: 17px; margin-top: 24px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #e8f6fb; }
  .passed { color: #137333; font-weight: 700; }
  .failed { color: #b91c1c; font-weight: 700; }
</style>
</head>
<body>
<h1>Comparación de datos esperados y obtenidos en Visor CORE</h1>
<h2>Contexto</h2>
${table(['Dato', 'Valor'], contextRows)}
<h2>Validaciones</h2>
${table(
    ['Entidad', 'Identificador', 'Campo', 'Esperado', 'Obtenido', 'Resultado'],
    input.rows.map(row => [
      row.entity,
      row.identifier ?? '',
      row.field,
      row.expected,
      row.actual,
      `<span class="${row.passed ? 'passed' : 'failed'}">${row.passed ? 'Correcto' : 'No coincide'}</span>`,
    ]),
    true,
  )}
</body>
</html>`;
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