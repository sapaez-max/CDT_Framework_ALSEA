import path from 'path';
import type {
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

type FlowStepDefinition = {
  label: string;
  patterns: RegExp[];
};

const functionalAnnotationTypes = new Set([
  'Juego de datos',
  'Pais',
  'Marca',
  'Sucursal',
  'Agregador',
  'Tipo de menu',
  'Fecha seleccionada',
  'Tipo de carga',
  'Versionar menu',
  'Descripcion',
  'Descripcion de filtros',
  'Descripcion de menu',
  'Item seleccionado',
  'Categoria del item',
]);

const flows: Readonly<Record<string, FlowStepDefinition[]>> = {
  '01-download-template.spec.ts': [
    step('Acceder al portal con la sesión autorizada', /Validar sesion autenticada/i),
    step('Seleccionar el país, la marca, la sucursal y el tipo de menú', /Preparar descarga de plantilla/i),
    step('Solicitar la plantilla del menú', /Solicitar plantilla/i),
    step('Recibir el correo y guardar la plantilla Excel', /Esperar correo nuevo y descargar Excel/i),
  ],
  '02-edit-template.spec.ts': [
    step(
      'Localizar la plantilla recibida, crear una copia y aplicar los cambios del escenario',
      /Localizar la plantilla de .+ y editar una copia/i,
    ),
  ],
  '03-upload-filters.spec.ts': [
    step('Acceder al portal con la sesión autorizada', /Acceder al portal con la sesion autorizada/i),
    step('Preparar la plantilla editada', /Copiar plantilla generada por/i),
    step('Cargar los filtros con los datos seleccionados', /Cargar la plantilla de filtros/i),
    step('Confirmar por correo el resultado de la carga', /Esperar y validar correo de carga de filtros/i),
  ],
  '04-upload-menu.spec.ts': [
    step('Acceder al portal con la sesión autorizada', /Acceder al portal con la sesion autorizada/i),
    step('Preparar la plantilla validada', /Copiar plantilla generada por/i),
    step('Publicar el menú para la marca y sucursal seleccionadas', /Publicar el menu/i),
    step('Confirmar por correo el resultado de la publicación', /Esperar y validar correo de carga de menu/i),
  ],
  '05-validate-visor.spec.ts': [
    step('Acceder al portal con la sesión autorizada', /Validar sesion autenticada/i),
    step('Recuperar del Excel el producto y los datos esperados', /Copiar plantilla generada|Leer item, grupo y modificadores/i),
    step(
      'Buscar el mismo producto en Visor CORE y comparar sus datos con el Excel',
      /Validar en Visor CORE los datos de la plantilla/i,
    ),
  ],
  '06-validate-json.spec.ts': [
    step('Acceder al portal con la sesión autorizada', /Validar sesion autenticada/i),
    step('Recuperar del Excel el producto y los datos esperados', /Copiar plantilla validada|Leer item, grupo, modificadores/i),
    step(
      'Abrir el JSON del mismo producto y comparar su contenido con el Excel',
      /Validar JSON publicado del menu/i,
    ),
  ],
  '07-reorder-groups.spec.ts': reorderFlow(
    'Reordenar grupos modificadores en una copia del Excel',
    'Validar en Visor CORE el nuevo orden de los grupos modificadores',
  ),
  '08-reorder-modifiers.spec.ts': reorderFlow(
    'Reordenar modificadores en una copia del Excel',
    'Validar en Visor CORE el nuevo orden de los modificadores',
  ),
  '09-reorder-groups-and-modifiers.spec.ts': reorderFlow(
    'Reordenar grupos y modificadores en una copia del Excel',
    'Validar en Visor CORE el nuevo orden de grupos y modificadores',
  ),
  '10-update-existing-menu.spec.ts': [
    step('Seleccionar la plantilla del menú ya publicado', /Identificar la plantilla del menu existente/i),
    step('Acceder al portal con la sesión autorizada', /Validar sesion autenticada/i),
    step('Consultar el producto y registrar su estado inicial en Visor CORE', /Capturar y validar el estado inicial/i),
    step('Crear una copia del Excel y modificar únicamente los elementos seleccionados', /Crear una copia y modificar selectivamente/i),
    step('Actualizar los filtros del menú existente', /Actualizar filtros del menu existente/i),
    step('Publicar la actualización del menú existente', /Publicar la actualizacion del menu existente/i),
    step('Consultar nuevamente el producto y comparar cambios, controles y duplicados', /Esperar y validar la propagacion/i),
  ],
};

export default class FunctionalFlowReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    const fileName = path.basename(test.location.file);
    const configuredFlow = flows[fileName];
    if (!configuredFlow) return;

    const definition = fileName === '03-upload-filters.spec.ts' && !test.tags.includes('@CP3')
      ? configuredFlow.filter(item => !/Confirmar por correo/.test(item.label))
      : configuredFlow;
    const technicalSteps = flattenSteps(result.steps)
      .filter(candidate => candidate.category === 'test.step');
    const rows = definition.map(item => {
      const matches = technicalSteps.filter(candidate =>
        item.patterns.some(pattern => pattern.test(candidate.title)));
      const failed = matches.some(candidate => Boolean(candidate.error));
      return {
        label: item.label,
        status: failed ? 'failed' as const : matches.length > 0 ? 'completed' as const : 'pending' as const,
      };
    });

    if (!rows.some(row => row.status === 'failed') && !['passed', 'skipped'].includes(result.status)) {
      let lastCompleted = -1;
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index].status === 'completed') {
          lastCompleted = index;
          break;
        }
      }
      if (lastCompleted >= 0) rows[lastCompleted].status = 'failed';
    }

    result.attachments.unshift({
      name: 'Flujo funcional',
      contentType: 'text/html',
      body: Buffer.from(buildFunctionalFlowHtml(test.title, result.annotations, rows), 'utf8'),
    });
  }
}

function reorderFlow(editLabel: string, validationLabel: string): FlowStepDefinition[] {
  return [
    step(editLabel, /Copiar plantilla generada por .+ y reordenar/i),
    step('Acceder al portal con la sesión autorizada', /Validar sesion autenticada/i),
    step('Cargar los filtros con la plantilla reordenada', /Cargar filtros con plantilla reordenada/i),
    step('Publicar el menú y confirmar el resultado por correo', /Cargar menu con los filtros reordenados/i),
    step(validationLabel, /Validar en Visor CORE el orden de grupos modificadores/i),
  ];
}

function step(label: string, ...patterns: RegExp[]): FlowStepDefinition {
  return { label, patterns };
}

function flattenSteps(steps: TestStep[]): TestStep[] {
  return steps.flatMap(candidate => [candidate, ...flattenSteps(candidate.steps)]);
}

function buildFunctionalFlowHtml(
  title: string,
  annotations: TestResult['annotations'],
  rows: Array<{ label: string; status: 'completed' | 'failed' | 'pending' }>,
): string {
  const contextRows = annotations
    .filter(annotation => functionalAnnotationTypes.has(annotation.type) && annotation.description)
    .map(annotation => `<tr><th>${escapeHtml(annotation.type)}</th><td>${escapeHtml(annotation.description ?? '')}</td></tr>`)
    .join('\n');
  const flow = rows.map((row, index) => `
    <div class="flow-node ${row.status}">
      <span class="number">${index + 1}</span>
      <span class="label">${escapeHtml(row.label)}</span>
      <span class="status">${statusLabel(row.status)}</span>
    </div>
    ${index < rows.length - 1 ? '<div class="arrow">↓</div>' : ''}`).join('');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Flujo funcional</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1f2933; background: #fff; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    h2 { margin: 26px 0 10px; font-size: 16px; }
    .subtitle { margin: 0 0 20px; color: #52606d; }
    .flow { max-width: 780px; margin: 14px auto 24px; }
    .flow-node { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; border: 2px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; background: #f8fafc; }
    .flow-node.completed { border-color: #22a06b; background: #edfdf5; }
    .flow-node.failed { border-color: #d92d20; background: #fff1f0; }
    .flow-node.pending { border-color: #98a2b3; background: #f2f4f7; }
    .number { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #0b7895; color: #fff; font-weight: 700; }
    .label { font-weight: 600; }
    .status { font-weight: 700; }
    .completed .status { color: #147d3f; }
    .failed .status { color: #b42318; }
    .pending .status { color: #667085; }
    .arrow { text-align: center; color: #0b7895; font-size: 24px; line-height: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f0f4f8; }
    .context th { width: 180px; }
  </style>
</head>
<body>
  <h1>Flujo funcional</h1>
  <p class="subtitle">${escapeHtml(title)}</p>
  ${contextRows ? `<h2>Datos utilizados</h2><table class="context"><tbody>${contextRows}</tbody></table>` : ''}
  <h2>Recorrido del caso de prueba</h2>
  <div class="flow">${flow}</div>
</body>
</html>`;
}

function statusLabel(status: 'completed' | 'failed' | 'pending'): string {
  if (status === 'completed') return 'COMPLETADO';
  if (status === 'failed') return 'FALLÓ';
  return 'NO EJECUTADO';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
