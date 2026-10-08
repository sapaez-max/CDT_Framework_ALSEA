import fs from 'fs';
import os from 'os';
import path from 'path';
import xlsx from 'xlsx';
import { describe, expect, it } from 'vitest';
import { readCoreViewerExpectation } from './core-viewer-template';

const suffix = '_AUTO_CP2_20261007_182718';

function withTemplate(editedPublishedModifiers: boolean, verify: (filePath: string) => void): void {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'core-viewer-template-'));
  const filePath = path.join(directory, 'template.xlsx');
  const workbook = xlsx.utils.book_new();
  const sheets: Record<string, unknown[][]> = {
    Items: [
      ['Item', 'Nombre Comercial', 'Descripcion', 'PriceLevel1', 'Daypart'],
      ['20061', `Cookies and Cream${suffix}`, 'Descripción del producto', 85, 'Todo el día'],
    ],
    GrupoModificador: [
      ['Grupo Modificador', 'Nombre Comercial', 'Descripcion', 'Orden', 'Subgrupos'],
      ['20061_1', `Adicionales${suffix}`, 'Descripción del grupo', 2, 'B,F'],
    ],
    Modificadores: [
      ['Item', 'Grupo Modificador', 'Modificador', 'Nombre Comercial Modificador', 'Orden', 'Subgrupos'],
      ['20061', '20061_1', '24108', `Fresa${suffix}`, 1, null],
      ['20061', '20061_1', '24110', `Cajeta${suffix}`, 2, null],
      ['20061', '20061_1', '24103', editedPublishedModifiers ? `Chips${suffix}` : 'Chips', 3, 'B'],
      ['20061', '20061_1', '24104', editedPublishedModifiers ? `Espiral${suffix}` : 'Espiral', 4, 'B'],
    ],
    Categorias: [
      ['Item', 'Categoria'],
      ['20061', 'Frappuccinos'],
    ],
    Subgrupos: [
      ['Subgrupo', 'Nombre Comercial'],
      ['B', 'Adicionales'],
      ['F', 'Jarabes'],
    ],
  };
  for (const [name, rows] of Object.entries(sheets)) {
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows), name);
  }
  xlsx.writeFile(workbook, filePath);

  try {
    verify(filePath);
  } finally {
    fs.unlinkSync(filePath);
    fs.rmdirSync(directory);
  }
}

describe('readCoreViewerExpectation', () => {
  it('lee los modificadores editados del subgrupo publicado', () => {
    withTemplate(true, filePath => {
      const expectation = readCoreViewerExpectation(filePath);
      expect(expectation.groupId).toBe('20061_1');
      expect(expectation.resolvedGroupId).toBe('20061_1_B');
      expect(expectation.resolvedGroupName).toBe('Adicionales');
      expect(expectation.modifiers.map(modifier => modifier.id)).toEqual(['24103', '24104']);
    });
  });

  it('rechaza una edición hecha solo en modificadores que no se publican', () => {
    withTemplate(false, filePath => {
      expect(() => readCoreViewerExpectation(filePath)).toThrow(/relacion publicada/i);
    });
  });
});
