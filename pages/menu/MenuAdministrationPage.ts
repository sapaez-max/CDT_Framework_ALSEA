import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import { downloadPath } from '@utils/downloads';

export type TemplateDownloadFormData = {
  country: string | string[];
  brand: string | string[];
  baseBranch?: string | string[];
  childBranch?: string | string[];
  menuType: string | string[];
  childMenuType?: string | string[];
  expectedMessage: RegExp;
};

export class MenuAdministrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openTemplateDownload(): Promise<void> {
    await this.openApplicationLauncher();
    await this.openMenuSection();
    await this.openAdministrationPage();
    await this.openDownloadTemplatePage();
    await expect(
      this.page.getByText(/Descargar plantilla|Pa[ií]s|Marca/i).first(),
      'Debe mostrarse la pantalla de descarga de plantilla',
    ).toBeVisible();
  }

  async downloadTemplate(caseData: TemplateDownloadFormData): Promise<string> {
    await this.selectField(/Pa[ií]s|Pa[ií]ses/i, caseData.country);
    await this.selectField(/Marca|Marcas/i, caseData.brand);

    if (caseData.baseBranch) {
      await this.selectField(/Sucursal base|Sucursales|Sucursal/i, caseData.baseBranch);
    }

    await this.selectField(/Tipo de men[uú]/i, caseData.menuType);

    if (caseData.childBranch) {
      await this.selectField(/Sucursal hija/i, caseData.childBranch);
    }

    if (caseData.childMenuType) {
      await this.selectField(/Tipo men[uú]/i, caseData.childMenuType);
    }

    const button = this.page.getByRole('button', { name: /Descargar plantilla/i }).first();
    await expect(button, 'Debe estar disponible el boton Descargar plantilla').toBeEnabled();

    const downloadPromise = this.page.waitForEvent('download', { timeout: 5_000 }).catch(() => null);
    await button.click();

    await expect(
      this.successMessage(caseData.expectedMessage),
      'El portal debe confirmar la solicitud y el envio de la plantilla por correo',
    ).toBeVisible();

    const download = await downloadPromise;
    return download ? downloadPath(download) : '';
  }

  private async openApplicationLauncher(): Promise<void> {
    await expect(this.page.locator('body')).toBeVisible();
    const launcher = this.page
      .getByRole('button', { name: /appstore/i })
      .or(this.page.locator('button#menu').filter({
        has: this.page.getByRole('img', { name: /appstore/i }),
      }))
      .first();

    await expect(launcher, 'Debe existir el boton launcher de aplicaciones appstore').toBeVisible();
    await launcher.click();

    await expect(
      this.rootApplicationMenu(),
      'Debe desplegarse el menu de aplicaciones',
    ).toBeVisible();
  }

  private async openMenuSection(): Promise<void> {
    const menuSection = this.rootApplicationMenu()
      .getByRole('menuitem', { name: /menu\s+Men[uú]/i })
      .or(this.rootApplicationMenu().locator('[role="menuitem"]').filter({ hasText: /^\s*Men/i }))
      .first();

    await expect(menuSection, 'Debe existir la seccion Menú dentro del launcher abierto').toBeVisible();
    await menuSection.hover();

    await expect(
      this.visibleSubmenuItem(/Administraci[oó]n/i),
      'Debe mostrarse la opcion Administracion al abrir la seccion Menu',
    ).toBeVisible();
  }

  private async openAdministrationPage(): Promise<void> {
    const administrationOption = this.visibleSubmenuItem(/Administraci[oó]n/i);

    await expect(administrationOption, 'Debe existir la opcion Administracion en el submenu Menu').toBeVisible();
    await administrationOption.click();
    await this.page.waitForURL(/\/menu\/admin\/?$/, { waitUntil: 'commit', timeout: 5_000 })
      .catch(async () => {
        await this.page.goto('/menu/admin/', { waitUntil: 'commit' });
      });

    await expect(
      this.page.getByText(/Administraci[oó]n de Men[uú]/i).first(),
      'Debe mostrarse la pantalla Administracion de Menu',
    ).toBeVisible();
  }

  private async openDownloadTemplatePage(): Promise<void> {
    const downloadTemplateLink = this.page.getByRole('link', { name: /Descargar plantilla/i }).first();

    await expect(downloadTemplateLink, 'Debe existir el link Descargar Plantilla en Administracion de Menu').toBeVisible();
    await downloadTemplateLink.click();

    await expect(
      this.page.getByRole('button', { name: /Descargar plantilla/i }).first(),
      'Debe mostrarse el formulario de descarga de plantilla',
    ).toBeVisible();
  }

  private async clickNavigationItem(name: RegExp): Promise<void> {
    const item = this.page
      .getByRole('button', { name })
      .or(this.page.getByRole('link', { name }))
      .or(this.page.getByRole('menuitem', { name }))
      .or(this.page.getByText(name))
      .first();

    await expect(item, `Debe existir la opcion de navegacion ${name}`).toBeVisible();
    await item.click();
  }

  private async selectField(label: RegExp, value: string | string[]): Promise<void> {
    const values = Array.isArray(value) ? value : [value];
    const field = this.field(label);
    await expect(field, `Debe existir el selector ${label}`).toBeVisible();
    await expect(field, `El selector ${label} debe terminar de cargar`).not.toHaveClass(/ant-select-loading/);

    if (await this.fieldContainsValue(field, values)) {
      return;
    }

    if (await this.isNativeSelect(field)) {
      await this.selectNativeOption(field, values);
      return;
    }

    const option = await this.findAutocompleteOption(field, values, label);
    await option.click();
    await expect
      .poll(() => this.fieldContainsValue(field, values), {
        message: `El selector ${label} debe mostrar el valor seleccionado`,
      })
      .toBe(true);
  }

  private field(label: RegExp): Locator {
    const knownAntField = this.knownAntField(label);

    return knownAntField
      .or(this.page.getByLabel(label))
      .or(this.page.getByPlaceholder(label))
      .or(this.page.getByRole('combobox', { name: label }))
      .or(this.page.locator('.ant-select, [role="combobox"]').filter({ hasText: label }).first())
      .first();
  }

  private knownAntField(label: RegExp): Locator {
    if (this.matchesLabel(label, ['Pais', 'Paises', 'País', 'Países'])) {
      return this.antSelectByInputId('country');
    }

    if (this.matchesLabel(label, ['Marca', 'Marcas'])) {
      return this.antSelectByInputId('brand');
    }

    if (this.matchesLabel(label, ['Sucursal', 'Sucursales', 'Sucursal base', 'Sucursal hija'])) {
      return this.antSelectByInputId('branch');
    }

    if (this.matchesLabel(label, ['Tipo de menu', 'Tipo de menú', 'Tipo menu', 'Tipo menú'])) {
      return this.antSelectByInputId('menuType');
    }

    return this.page.locator('__no_known_ant_field__');
  }

  private antSelectByInputId(inputId: string): Locator {
    return this.page.locator('.ant-select').filter({
      has: this.page.locator(`input#${inputId}`),
    }).first();
  }

  private matchesLabel(label: RegExp, candidates: string[]): boolean {
    return candidates.some((candidate) => label.test(candidate));
  }

  private async isNativeSelect(locator: Locator): Promise<boolean> {
    return locator
      .evaluate((element) => element.tagName.toLowerCase() === 'select')
      .catch(() => false);
  }

  private async findAutocompleteOption(field: Locator, values: string[], label: RegExp): Promise<Locator> {
    const failures: string[] = [];

    for (const value of values) {
      for (const searchValue of this.searchQueriesForValue(value)) {
        await field.click();
        await this.typeIntoCombobox(field, searchValue);
        await expect(this.visibleDropdown(), `Debe abrirse el dropdown filtrado de ${label}`).toBeVisible();

        const matched = await this.matchVisibleOption(value);
        if (matched.status === 'found') {
          return matched.option;
        }

        failures.push(`Buscando "${searchValue}": ${matched.message}`);
      }
    }

    throw new Error(`No se encontro una opcion valida para ${label}. Valores buscados: ${values.join(', ')}. ${failures.join(' | ')}`);
  }

  private async typeIntoCombobox(field: Locator, value: string): Promise<void> {
    const input = field.locator('input[role="combobox"], input[type="search"]').first();

    if (await input.count()) {
      await input.fill(value);
      return;
    }

    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.type(value);
  }

  private async matchVisibleOption(value: string): Promise<
    | { status: 'found'; option: Locator }
    | { status: 'missing' | 'ambiguous'; message: string }
  > {
    const optionTexts = await this.visibleAntOptions().evaluateAll((options) =>
      options.map((option, index) => ({
        index,
        text: (option.textContent || '').trim(),
        title: option.getAttribute('title') || '',
      })),
    );
    const normalizedValue = normalizeForComparison(value);
    const exact = optionTexts.filter((option) =>
      [option.text, option.title].some((text) => normalizeForComparison(text) === normalizedValue),
    );

    if (exact.length) {
      return { status: 'found', option: this.visibleAntOptions().nth(exact[0].index) };
    }

    const termMatches = this.matchOptionsByTerms(optionTexts, value);
    if (termMatches.length === 1) {
      return { status: 'found', option: this.visibleAntOptions().nth(termMatches[0].index) };
    }

    if (termMatches.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide con multiples opciones por terminos: ${termMatches.map((option) => option.text || option.title).join(', ')}`,
      };
    }

    const partial = optionTexts.filter((option) =>
      [option.text, option.title].some((text) => normalizeForComparison(text).includes(normalizedValue)),
    );

    if (partial.length === 1) {
      return { status: 'found', option: this.visibleAntOptions().nth(partial[0].index) };
    }

    if (partial.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide con multiples opciones: ${partial.map((option) => option.text || option.title).join(', ')}`,
      };
    }

    return {
      status: 'missing',
      message: `El valor "${value}" no coincide con opciones visibles: ${optionTexts.map((option) => option.text || option.title).join(', ') || 'sin opciones'}`,
    };
  }

  private matchOptionsByTerms(
    options: Array<{ index: number; text: string; title: string }>,
    value: string,
  ): Array<{ index: number; text: string; title: string }> {
    const terms = this.significantTerms(value);

    if (terms.length < 2) {
      return [];
    }

    return options.filter((option) =>
      [option.text, option.title].some((text) => {
        const normalizedText = normalizeForComparison(text);
        const textTokens = normalizedText.split(/\s+/);

        return terms.every((term) =>
          /^\d+$/.test(term)
            ? textTokens.includes(term)
            : normalizedText.includes(term),
        );
      }),
    );
  }

  private searchQueriesForValue(value: string): string[] {
    return Array.from(new Set([
      value,
      ...this.significantTerms(value).filter((term) => !/^\d+$/.test(term)),
      ...this.significantTerms(value).filter((term) => /^\d+$/.test(term)),
    ]));
  }

  private significantTerms(value: string): string[] {
    return normalizeForComparison(value)
      .replace(/[()]/g, ' ')
      .split(' ')
      .filter((term) => term.length > 1);
  }

  private async selectNativeOption(field: Locator, values: string[]): Promise<void> {
    for (const value of values) {
      const selected = await field
        .selectOption({ label: value })
        .then(() => true)
        .catch(async () => field.selectOption(value).then(() => true).catch(() => false));

      if (selected) return;
    }

    throw new Error(`No se encontro ninguna opcion nativa para: ${values.join(', ')}`);
  }

  private async fieldContainsValue(field: Locator, values: string[]): Promise<boolean> {
    const currentText = await field.textContent().catch(() => '');
    const normalizedCurrentText = normalizeForComparison(currentText || '');

    return values.some((value) => normalizedCurrentText.includes(normalizeForComparison(value)));
  }

  private visibleDropdown(): Locator {
    return this.page.locator('.ant-select-dropdown:visible').first();
  }

  private visibleAntOptions(): Locator {
    return this.page.locator('.ant-select-dropdown:visible .ant-select-item-option');
  }

  private successMessage(pattern: RegExp): Locator {
    return this.page
      .getByRole('alert')
      .filter({ hasText: pattern })
      .or(this.page.getByText(pattern))
      .first();
  }

  private rootApplicationMenu(): Locator {
    return this.page.locator('ul[role="menu"].ant-menu-root').filter({
      hasText: /Usuarios|Men[uú]|Carga Men[uú]/i,
    }).first();
  }

  private visibleSubmenuItem(name: RegExp): Locator {
    return this.page.locator('.ant-menu-submenu-popup:visible [role="menuitem"]')
      .filter({ hasText: name })
      .first();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
