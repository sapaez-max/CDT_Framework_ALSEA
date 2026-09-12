import path from 'path';

export function buildExcelAttachmentName(description: string, filePath: string): string {
  return `${description} - ${path.basename(filePath)}`;
}
