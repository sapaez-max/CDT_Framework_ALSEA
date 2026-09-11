import path from 'path';
import type { EmailValidationResult, TemplateEmailResult } from '@src/integrations/google/gmail-client';

type EvidenceCaseData = {
  id: string;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  country: string | string[];
  brand: string | string[];
  baseBranch?: string | string[];
  branch?: string | string[];
  menuType: string | string[];
};

type EmailEvidenceInput = {
  caseData: EvidenceCaseData;
  email: TemplateEmailResult;
};

export function buildEmailEvidenceHtml({ caseData, email }: EmailEvidenceInput): string {
  const rows = email.validations.map(validationRow).join('\n');
  const branch = caseData.baseBranch ?? caseData.branch ?? [];

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Evidencia correo ${escapeHtml(caseData.id)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1f2933; background: #ffffff; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    h2 { margin: 26px 0 10px; font-size: 16px; }
    .subtitle { margin: 0 0 18px; color: #52606d; }
    .meta, .validations { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .meta th, .meta td, .validations th, .validations td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; vertical-align: top; }
    .meta th { width: 220px; background: #f0f4f8; }
    .validations th { background: #f0f4f8; }
    .status { font-weight: 700; text-align: center; white-space: nowrap; }
    .pass { color: #0f8a3a; }
    .fail { color: #b42318; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid #d9e2ec; background: #f8fafc; padding: 12px; margin: 0; }
  </style>
</head>
<body>
  <h1>Validacion de correo</h1>
  <p class="subtitle">${escapeHtml(caseData.id)} - ${escapeHtml(caseData.title)}</p>

  <h2>Datos del caso</h2>
  <table class="meta">
    <tbody>
      <tr><th>Caso</th><td>${escapeHtml(caseData.id)}</td></tr>
      <tr><th>Requerimiento</th><td>${escapeHtml(caseData.requirement)}</td></tr>
      <tr><th>Trazabilidad Excel</th><td>Hoja ${escapeHtml(caseData.sourceSheet)}, fila ${caseData.sourceRow}</td></tr>
      <tr><th>Pais esperado</th><td>${escapeHtml(formatValues(caseData.country))}</td></tr>
      <tr><th>Marca esperada</th><td>${escapeHtml(formatValues(caseData.brand))}</td></tr>
      <tr><th>Sucursal esperada</th><td>${escapeHtml(formatValues(branch))}</td></tr>
      <tr><th>Tipo de menu esperado</th><td>${escapeHtml(formatValues(caseData.menuType))}</td></tr>
    </tbody>
  </table>

  <h2>Correo recibido</h2>
  <table class="meta">
    <tbody>
      <tr><th>Fecha del correo</th><td>${escapeHtml(email.receivedAt || 'No disponible')}</td></tr>
      <tr><th>Remitente recibido</th><td>${escapeHtml(email.from)}</td></tr>
      <tr><th>Asunto recibido</th><td>${escapeHtml(email.subject)}</td></tr>
      <tr><th>Adjunto</th><td>${escapeHtml(email.attachmentName ?? 'No aplica')}</td></tr>
      <tr><th>Archivo guardado</th><td>${escapeHtml(email.savedPath ? path.basename(email.savedPath) : 'No aplica')}</td></tr>
    </tbody>
  </table>

  <h2>Validaciones ejecutadas</h2>
  <table class="validations">
    <thead>
      <tr>
        <th>Validacion</th>
        <th>Esperado</th>
        <th>Encontrado</th>
        <th>Resultado</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <h2>Contenido del correo</h2>
  <pre>${escapeHtml(email.bodyPreview || 'No se obtuvo contenido textual del correo.')}</pre>
</body>
</html>`;
}

export function excelContentType(filePath: string): string {
  if (/\.xlsx$/i.test(filePath)) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  if (/\.xls$/i.test(filePath)) {
    return 'application/vnd.ms-excel';
  }

  return 'application/octet-stream';
}

function validationRow(validation: EmailValidationResult): string {
  const status = validation.passed ? 'PASS' : 'FAIL';
  const statusClass = validation.passed ? 'pass' : 'fail';

  return `<tr>
        <td>${escapeHtml(validation.label)}</td>
        <td>${escapeHtml(validation.expected)}</td>
        <td>${escapeHtml(validation.actual)}</td>
        <td class="status ${statusClass}">${status}</td>
      </tr>`;
}

function formatValues(value: string | string[]): string {
  return Array.isArray(value) ? value.join(' o ') : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
