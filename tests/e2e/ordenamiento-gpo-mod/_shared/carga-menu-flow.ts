import type { Page } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/auth/LoginPage';
import { MenuAdministrationPage } from '@pages/menu/MenuAdministrationPage';
import type { MenuLoadCase } from './casos.data';
import { goToLanding } from './ordenamiento-flow';

export async function ejecutarCargaMenu(page: Page, caseData: MenuLoadCase): Promise<void> {
  await goToLanding(page);
  await new LoginPage(page).expectAuthenticated();

  const menuPage = new MenuAdministrationPage(page);
  await menuPage.openMenuLoad();
  await menuPage.loadMenu(caseData);
}
