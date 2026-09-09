import { expect, type Page } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { TemplateDownloadCase } from './casos.data';

export async function ejecutarDescargaPlantilla(page: Page, caseData: TemplateDownloadCase): Promise<void> {
  await goToLanding(page);
  await new LoginPage(page).expectAuthenticated();

  const menuPage = new MenuAdministrationPage(page);
  await menuPage.openTemplateDownload();
  const downloadedPath = await menuPage.downloadTemplate(caseData);

  if (downloadedPath) {
    expect(downloadedPath, 'La descarga directa del navegador debe generar un archivo Excel').toMatch(/\.xlsx?$/i);
  }
}

export async function goToLanding(page: Page): Promise<void> {
  await page.goto(env.login.landingPath, { waitUntil: 'commit' }).catch((error: Error) => {
    if (!/ERR_ABORTED/i.test(error.message)) {
      throw error;
    }
  });
}
