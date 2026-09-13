import crypto from 'crypto';
import path from 'path';
import type { ReorderChange } from '@utils/group-reorder-template';
import type {
  MenuSnapshot,
  MenuSnapshotComparison,
} from '@utils/menu-update-snapshot';

export type MenuUpdateEvidenceInput = {
  caseId: string;
  title: string;
  executionTimestamp: string;
  context: {
    country: string;
    brand: string;
    branch: string;
    aggregator: string;
    menuType: string;
  };
  item: { id: string; name: string };
  category: string;
  sourceFile: string;
  resultFile: string;
  changes: ReorderChange[];
  beforeJson: string;
  afterJson: string;
  baselineSnapshot: MenuSnapshot;
  expectedSnapshot: MenuSnapshot;
  actualSnapshot: MenuSnapshot;
  semanticComparison: MenuSnapshotComparison;
};

export function buildMenuUpdateEvidenceHtml(input: MenuUpdateEvidenceInput): string {
  const groupRows = input.changes.filter(change => change.entityType === 'modifierGroup');
  const modifierRows = input.changes.filter(change => change.entityType === 'modifier');
  const validationRows = input.semanticComparison.checks.map(check => `<tr>
    <td>${escapeHtml(check.validation)}</td>
    <td>${escapeHtml(check.expected)}</td>
    <td>${escapeHtml(check.actual)}</td>
    <td class="${check.passed ? 'pass' : 'fail'}">${check.passed ? 'CORRECTO' : 'FALLÓ'}</td>
  </tr>`).join('\n');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(input.caseId)} - Comparación semántica del menú</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1f2933; background: #fff; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    h2 { margin: 26px 0 10px; font-size: 16px; }
    .subtitle { margin: 0 0 18px; color: #52606d; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #f0f4f8; }
    .meta th { width: 220px; }
    .pass { color: #147d3f; font-weight: 700; }
    .fail { color: #b42318; font-weight: 700; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.caseId)} - Comparación del menú antes y después</h1>
  <p class="subtitle">${escapeHtml(input.title)}</p>

  <h2>Contexto de ejecución</h2>
  <table class="meta"><tbody>
    <tr><th>Fecha de ejecución</th><td>${escapeHtml(input.executionTimestamp)}</td></tr>
    <tr><th>País</th><td>${escapeHtml(input.context.country)}</td></tr>
    <tr><th>Marca</th><td>${escapeHtml(input.context.brand)}</td></tr>
    <tr><th>Sucursal</th><td>${escapeHtml(input.context.branch)}</td></tr>
    <tr><th>Agregador</th><td>${escapeHtml(input.context.aggregator)}</td></tr>
    <tr><th>Tipo de menú</th><td>${escapeHtml(input.context.menuType)}</td></tr>
    <tr><th>Categoría</th><td>${escapeHtml(input.category)}</td></tr>
    <tr><th>Item</th><td>${escapeHtml(`${input.item.id} - ${input.item.name}`)}</td></tr>
  </tbody></table>

  ${changesTable('Grupos modificadores actualizados', groupRows)}
  ${changesTable('Modificadores actualizados', modifierRows)}

  <h2>Cobertura de controles</h2>
  <table><thead><tr><th>Tipo</th><th>Modificados</th><th>Controles sin modificar</th></tr></thead><tbody>
    <tr><td>Grupos modificadores</td><td>${input.semanticComparison.changedGroups}</td><td>${input.semanticComparison.controlGroups}</td></tr>
    <tr><td>Modificadores</td><td>${input.semanticComparison.changedModifiers}</td><td>${input.semanticComparison.controlModifiers}</td></tr>
  </tbody></table>

  <h2>Validación semántica: estado esperado contra estado final</h2>
  <table><thead><tr><th>Validación</th><th>Esperado</th><th>Actual</th><th>Resultado</th></tr></thead>
  <tbody>${validationRows}</tbody></table>

  <h2>Archivos</h2>
  <table class="meta"><tbody>
    <tr><th>Plantilla original</th><td><code>${escapeHtml(input.sourceFile)}</code></td></tr>
    <tr><th>Plantilla actualizada</th><td><code>${escapeHtml(input.resultFile)}</code></td></tr>
    <tr><th>Nombre original</th><td>${escapeHtml(path.basename(input.sourceFile))}</td></tr>
    <tr><th>Nombre actualizado</th><td>${escapeHtml(path.basename(input.resultFile))}</td></tr>
  </tbody></table>
</body>
</html>`;
}

export function buildTechnicalMenuJsonComparison(input: MenuUpdateEvidenceInput): string {
  return JSON.stringify({
    caseId: input.caseId,
    executionTimestamp: input.executionTimestamp,
    item: input.item,
    category: input.category,
    comparison: {
      beforeSha256: digest(input.beforeJson),
      afterSha256: digest(input.afterJson),
      rawContentChanged: digest(input.beforeJson) !== digest(input.afterJson),
      semanticValidationPassed: input.semanticComparison.failures.length === 0,
      failures: input.semanticComparison.failures,
      controls: {
        changedGroups: input.semanticComparison.changedGroups,
        unchangedGroups: input.semanticComparison.controlGroups,
        changedModifiers: input.semanticComparison.changedModifiers,
        unchangedModifiers: input.semanticComparison.controlModifiers,
      },
    },
    expectedChanges: input.changes.map(change => ({
      entity: change.entityType,
      id: change.entityId,
      name: change.entityName,
      parentGroupId: change.parentGroupId,
      field: change.field,
      before: change.previousValue,
      after: change.newValue,
    })),
    snapshots: {
      baseline: input.baselineSnapshot,
      expected: input.expectedSnapshot,
      actual: input.actualSnapshot,
    },
    raw: {
      before: parseJson(input.beforeJson),
      after: parseJson(input.afterJson),
    },
  }, null, 2);
}

function changesTable(title: string, changes: ReorderChange[]): string {
  const rows = changes.map(change => `<tr>
    <td>${escapeHtml(change.entityId)}</td>
    <td>${escapeHtml(change.entityName)}</td>
    <td>${escapeHtml(change.previousValue)}</td>
    <td>${escapeHtml(change.newValue)}</td>
    <td class="pass">MODIFICADO</td>
  </tr>`).join('\n');

  return `<h2>${escapeHtml(title)}</h2>
  <table><thead><tr><th>ID</th><th>Nombre</th><th>Orden anterior</th><th>Orden nuevo</th><th>Estado</th></tr></thead>
  <tbody>${rows}</tbody></table>`;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function digest(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
