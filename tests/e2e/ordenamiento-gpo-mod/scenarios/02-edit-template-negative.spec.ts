import fs from 'fs';
import { randomUUID } from 'crypto';
import xlsx, { type WorkBook } from 'xlsx';
import { fileTest as test, expect } from '@fixtures/base.fixture';
import { saveCaseExcel, getLatestExcelForCase, type ArtifactScope } from '@utils/case-artifact-manager';
import { formatExecutionTimestamp } from '@utils/execution-timestamp';
import { buildModificationEvidenceHtml } from '@src/reporting/modification-evidence';
import { ExcelService } from '../services/excel.service';
import { getDataset } from '../data/datasets.data';

const dataset = getDataset('starbucks-wtc-uber');
const caseId = 'CP2';

type NegativeVariant = {
  id: 'N01' | 'N02';
  title: string;
  expectedError: RegExp;
  mutate: (workbook: WorkBook) => Array<{
    entity: string;
    previousValue: string;
    newValue: string;
  }>;
};

const variants: NegativeVariant[] = [
  {
    id: 'N01',
    title: 'rechaza una plantilla sin la hoja GrupoModificador',
    expectedError: /La plantilla no contiene la hoja obligatoria GrupoModificador/,
    mutate: workbook => {
      delete workbook.Sheets.GrupoModificador;
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== 'GrupoModificador');
      return [{
        entity: 'Hoja GrupoModificador',
        previousValue: 'Presente',
        newValue: 'Ausente',
      }];
    },
  },
  {
    id: 'N02',
    title: 'rechaza una plantilla sin dos modificadores habilitados',
    expectedError: /No se encontro un item .* al menos dos modificadores .* habilitados para UBER EATS/,
    mutate: workbook => {
      const sheet = workbook.Sheets.Modificadores;
      const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
      const aggregatorColumn = rows[0].findIndex(value => value === dataset.aggregator);
      expect(aggregatorColumn).toBeGreaterThanOrEqual(0);

      return rows.slice(1).map((row, index) => {
        const previousValue = String(row[aggregatorColumn] ?? '');
        xlsx.utils.sheet_add_aoa(sheet, [['']], { origin: { r: index + 1, c: aggregatorColumn } });
        return {
          entity: `Modificadores!${xlsx.utils.encode_cell({ r: index + 1, c: aggregatorColumn })}`,
          previousValue,
          newValue: '(vacío)',
        };
      });
    },
  },
];

test.describe('CP2 - variantes negativas de edición de plantilla', {
  tag: ['@ordenamiento-gpo-mod', '@edicion-plantilla', '@negativo', '@CP2', '@starbucks'],
}, () => {
  for (const variant of variants) {
    test(`${caseId}-${variant.id} - ${variant.title}`, async ({}, testInfo) => {
      const variantId = `${caseId}-${variant.id}`;
      const executionTimestamp = formatExecutionTimestamp();
      const runId = `${variantId}_${executionTimestamp}_${randomUUID().slice(0, 8)}`;
      const scope: ArtifactScope = {
        runId,
        runGroup: 'negative-tests',
        datasetId: `${dataset.id}-negative`,
      };
      const controlScope: ArtifactScope = {
        runId,
        runGroup: 'negative-tests',
        datasetId: `${dataset.id}-control`,
      };
      const excel = new ExcelService();
      const validWorkbook = buildValidTemplate();
      const validBuffer = writeWorkbook(validWorkbook);
      let baselinePath = '';

      testInfo.annotations.push(
        { type: 'Juego de datos', description: dataset.id },
        { type: 'Marca', description: 'STARBUCKS' },
        { type: 'Agregador', description: dataset.aggregator },
        { type: 'Variante', description: variantId },
      );

      await test.step('Validar plantilla de control', async () => {
        baselinePath = saveCaseExcel('CP1', 'plantilla-control.xlsx', validBuffer, controlScope);
        const result = excel.editTemplate(caseId, 'CP1', dataset.aggregator, controlScope);
        expect(fs.existsSync(result.outputPath)).toBe(true);
        expect(result.modifierEdits).toHaveLength(2);
      });

      let invalidSourcePath = '';
      let invalidBuffer: Buffer;

      await test.step('Preparar plantilla negativa', async () => {
        const workbook = xlsx.read(validBuffer, { type: 'buffer' });
        const structuralChanges = variant.mutate(workbook);
        invalidBuffer = writeWorkbook(workbook);
        invalidSourcePath = saveCaseExcel('CP1', 'plantilla-negativa.xlsx', invalidBuffer, scope);

        await testInfo.attach('Resumen comparativo de cambios en Excel', {
          body: Buffer.from(buildModificationEvidenceHtml({
            caseId: variantId,
            title: variant.title,
            context: {
              country: dataset.country,
              brand: 'STARBUCKS',
              branch: dataset.branch.code,
              aggregator: dataset.aggregator,
              menuType: dataset.menuType,
            },
            sourceFile: baselinePath,
            resultFile: invalidSourcePath,
            structuralChanges,
          }), 'utf8'),
          contentType: 'text/html',
        });
        await testInfo.attach('Plantilla Excel válida de origen', {
          path: baselinePath,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        await testInfo.attach('Plantilla Excel preparada para el caso negativo', {
          path: invalidSourcePath,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      });

      await test.step('Validar rechazo esperado', async () => {
        let actualError: unknown;
        try {
          excel.editTemplate(caseId, 'CP1', dataset.aggregator, scope);
        } catch (error) {
          actualError = error;
        }

        expect(actualError, 'La edición debe rechazar la plantilla inválida').toBeInstanceOf(Error);
        const actualMessage = (actualError as Error).message;
        await testInfo.attach('Resultado de validación de plantilla', {
          body: Buffer.from(JSON.stringify({
            variant: variantId,
            expectedError: variant.expectedError.source,
            actualError: actualMessage,
          }, null, 2), 'utf8'),
          contentType: 'application/json',
        });
        expect(actualMessage).toMatch(variant.expectedError);
        expect(fs.readFileSync(invalidSourcePath)).toEqual(invalidBuffer);
        expect(fs.readFileSync(getLatestExcelForCase(caseId, scope))).toEqual(invalidBuffer);
      });
    });
  }
});

function buildValidTemplate(): WorkBook {
  const workbook = xlsx.utils.book_new();
  const sheets: Array<[string, unknown[][]]> = [
    ['Items', [
      ['Item', 'Nombre Comercial'],
      ['20061', 'Producto de prueba'],
    ]],
    ['Categorias', [
      ['Item', 'Categoria'],
      ['20061', 'Bebidas de prueba'],
    ]],
    ['GrupoModificador', [
      ['Grupo Modificador', 'Nombre Comercial', 'Orden', 'Subgrupos', 'Descripcion', dataset.aggregator],
      ['20061_1', 'Grupo de prueba', 1, '', 'Grupo de prueba', '*'],
    ]],
    ['Modificadores', [
      ['Item', 'Grupo Modificador', 'Modificador', 'Subgrupos', 'Nombre Comercial Modificador', 'Orden', dataset.aggregator],
      ['20061', '20061_1', 'MOD_A', '', 'Modificador A', 1, '*'],
      ['20061', '20061_1', 'MOD_B', '', 'Modificador B', 2, '*'],
    ]],
    ['Subgrupos', [
      ['Subgrupo', 'Nombre Comercial'],
      ['I', 'Subgrupo de prueba'],
    ]],
  ];

  for (const [name, rows] of sheets) {
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows), name);
  }
  return workbook;
}

function writeWorkbook(workbook: WorkBook): Buffer {
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
