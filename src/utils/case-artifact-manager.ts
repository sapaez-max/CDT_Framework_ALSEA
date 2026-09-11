import fs from 'fs';
import path from 'path';

export type CaseExcelCopy = {
  sourcePath: string;
  targetPath: string;
};

export type ArtifactScope = {
  datasetId: string;
  runId?: string;
};

const excelPattern = /\.xlsx?$/i;

export function caseDownloadDirectory(caseId: string, scope: ArtifactScope): string {
  return path.resolve(
    'artifacts',
    'runs',
    safeSegment(scope.runId ?? process.env.ALSEA_RUN_ID ?? 'manual'),
    safeSegment(caseId),
    safeSegment(scope.datasetId),
  );
}

export function prepareCaseDownloadDirectory(caseId: string, scope: ArtifactScope): string {
  const directory = caseDownloadDirectory(caseId, scope);
  fs.mkdirSync(directory, { recursive: true });
  cleanCaseExcel(caseId, scope);

  return directory;
}

export function cleanCaseExcel(caseId: string, scope: ArtifactScope): void {
  const directory = caseDownloadDirectory(caseId, scope);
  if (!fs.existsSync(directory)) return;

  for (const file of fs.readdirSync(directory)) {
    if (!excelPattern.test(file)) continue;

    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'EBUSY' || code === 'EPERM') {
          throw new Error(
            `No se pudo reemplazar el Excel anterior porque esta abierto o bloqueado por otra aplicacion: ${filePath}. Cierre Excel o la vista previa del archivo y vuelva a ejecutar el caso.`,
            { cause: error },
          );
        }
        throw error;
      }
    }
  }
}

export function saveCaseExcel(
  caseId: string,
  filename: string,
  content: Buffer,
  scope: ArtifactScope,
): string {
  const directory = prepareCaseDownloadDirectory(caseId, scope);
  const outputPath = path.join(directory, path.basename(filename));
  fs.writeFileSync(outputPath, content);

  return outputPath;
}

export function getLatestExcelForCase(caseId: string, scope: ArtifactScope): string {
  const directory = caseDownloadDirectory(caseId, scope);
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
  scope,
}: {
  fromCase: string;
  toCase: string;
  scope: ArtifactScope;
}): CaseExcelCopy {
  const sourcePath = getLatestExcelForCase(fromCase, scope);
  const directory = prepareCaseDownloadDirectory(toCase, scope);
  const targetPath = path.join(directory, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, targetPath);

  return { sourcePath, targetPath };
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
