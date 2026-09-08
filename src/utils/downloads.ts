import fs from 'fs';
import path from 'path';
import type { Download, Page } from '@playwright/test';

export async function saveDownload(
  page: Page,
  trigger: () => Promise<void>,
  targetDir = 'artifacts/downloads',
): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    trigger(),
  ]);

  const suggestedName = download.suggestedFilename();
  const outputDir = path.resolve(targetDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const targetPath = path.join(outputDir, suggestedName);
  await download.saveAs(targetPath);
  return targetPath;
}

export async function downloadPath(download: Download, targetDir = 'artifacts/downloads'): Promise<string> {
  const outputDir = path.resolve(targetDir);
  fs.mkdirSync(outputDir, { recursive: true });
  const targetPath = path.join(outputDir, download.suggestedFilename());
  await download.saveAs(targetPath);
  return targetPath;
}
