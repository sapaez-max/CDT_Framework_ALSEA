import fs from 'fs';
import path from 'path';

export function ensureDir(dirPath: string): string {
  const resolved = path.resolve(dirPath);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(filePath));
}
