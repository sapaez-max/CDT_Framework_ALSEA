import xlsx from 'xlsx';

export function getHeaderRow(filePath: string, sheetIndex = 0): string[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  return rows[0] ?? [];
}
