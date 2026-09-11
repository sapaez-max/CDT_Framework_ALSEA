import fs from 'fs';
import path from 'path';

export type CaseExcelCopy = {
  sourcePath: string;
  targetPath: string;
};

const excelPattern = /\.xlsx?$/i;

export function caseDownloadDirectory(caseId: string): string {
  return path.resolve('artifacts', 'downloads', safeSegment(caseId));
}

export function prepareCaseDownloadDirectory(caseId: string): string {
  const directory = caseDownloadDirectory(caseId);
  fs.mkdirSync(directory, { recursive: true });
  cleanCaseExcel(caseId);

  return directory;
}

export function cleanCaseExcel(caseId: string): void {
  const directory = caseDownloadDirectory(caseId);
  if (!fs.existsSync(directory)) return;

  for (const file of fs.readdirSync(directory)) {
    if (!excelPattern.test(file)) continue;

    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      fs.unlinkSync(filePath);
    }
  }
}

export function saveCaseExcel(caseId: string, filename: string, content: Buffer): string {
  const directory = prepareCaseDownloadDirectory(caseId);
  const outputPath = path.join(directory, path.basename(filename));
  fs.writeFileSync(outputPath, content);

  return outputPath;
}

export function getLatestExcelForCase(caseId: string): string {
  const directory = caseDownloadDirectory(caseId);
  if (!fs.existsSync(directory)) {
    throw new Error(
      `${caseId} requiere un Excel generado previamente. No se encontro la carpeta: ${directory}. Ejecute primero el caso anterior o el bloque correspondiente.`,
    );
  }

  const files = fs.readdirSync(directory)
    .filter(file => excelPattern.test(file))
    .map(file => path.join(directory, file));

  if (files.length === 0) {
    throw new Error(
      `${caseId} requiere un Excel generado previamente. No se encontro ningun archivo .xls o .xlsx en: ${directory}. Ejecute primero el caso anterior o el bloque correspondiente.`,
    );
  }

  if (files.length > 1) {
    throw new Error(
      `Se esperaba un unico Excel para ${caseId}, pero se encontraron ${files.length} archivos: ${files.map(file => path.basename(file)).join(', ')}.`,
    );
  }

  return files[0];
}

export function copyExcelFromPreviousCase({
  fromCase,
  toCase,
}: {
  fromCase: string;
  toCase: string;
}): CaseExcelCopy {
  const sourcePath = getLatestExcelForCase(fromCase);
  const directory = prepareCaseDownloadDirectory(toCase);
  const targetPath = path.join(directory, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, targetPath);

  return { sourcePath, targetPath };
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
