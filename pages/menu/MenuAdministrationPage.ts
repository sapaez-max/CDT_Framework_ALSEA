import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

const FILE_OPERATION_TIMEOUT_MS = 30_000;

type VisibleOptionData = {
  index: number;
  text: string;
  title: string;
  ariaLabel: string;
};

export type TemplateDownloadFormData = {
  country: string | string[];
  brand: string | string[];
  baseBranch?: string | string[];
  expectedBaseBranchLabel?: string;
  childBranch?: string | string[];
  menuType: string | string[];
  childMenuType?: string | string[];
  downloadDate?: string;
  exactSelections?: boolean;
  expectedMessage: RegExp;
};

export type MenuLoadFormData = {
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  aggregator: string | string[];
  menuType: string | string[];
  description: string;
  expectedMessage: RegExp;
};

export type MenuLoadPortalResult = {
  status: 'accepted' | 'endpoint-timeout';
  notification: string;
};

export type FilterLoadFormData = {
  country: string | string[];
  brand: string | string[];
  baseBranch?: string | string[];
  branch?: string | string[];
  aggregator?: string | string[];
  menuType: string | string[];
  childBranch?: string | string[];
  childMenuType?: string | string[];
  loadType: string | string[];
  versionMenu: string | string[];
  description: string;
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

  async prepareTemplateDownload(caseData: TemplateDownloadFormData): Promise<void> {
    await this.selectField(/Pa[ií]s|Pa[ií]ses/i, caseData.country, caseData.exactSelections);
    await this.selectField(/Marca|Marcas/i, caseData.brand, caseData.exactSelections);

    if (caseData.baseBranch) {
      await this.selectField(
        /Sucursal base|Sucursales|Sucursal/i,
        caseData.baseBranch,
        caseData.exactSelections,
        caseData.expectedBaseBranchLabel,
      );
    }

    await this.selectField(/Tipo de men[uú]/i, caseData.menuType, caseData.exactSelections);

    if (caseData.childBranch) {
      await this.selectField(/Sucursal hija/i, caseData.childBranch);
    }

    if (caseData.childMenuType) {
      await this.selectField(/Tipo men[uú]/i, caseData.childMenuType);
    }

    if (caseData.downloadDate) {
      await this.setDownloadDate(caseData.downloadDate);
    }
  }

  async requestTemplateDownload(expectedMessage: RegExp): Promise<void> {
    const button = this.page.getByRole('button', { name: /Descargar plantilla/i }).first();
    await expect(button, 'Debe estar disponible el boton Descargar plantilla').toBeEnabled();
    await button.click();

    await expect(
      this.successMessage(expectedMessage),
      'El portal debe confirmar la solicitud y el envio de la plantilla por correo',
    ).toBeVisible({ timeout: FILE_OPERATION_TIMEOUT_MS });
  }

  async openMenuLoad(): Promise<void> {
    await this.openApplicationLauncher();
    await this.openMenuSection();
    await this.openAdministrationPage();
    await this.openLoadMenuPage();
  }

  async openFilterLoad(): Promise<void> {
    await this.openApplicationLauncher();
    await this.openMenuSection();
    await this.openAdministrationPage();
    await this.openFilterLoadPage();
  }

  async loadMenu(caseData: MenuLoadFormData): Promise<MenuLoadPortalResult> {
    await this.selectField(/Pa[ií]s|Pa[ií]ses/i, caseData.country);
    await this.selectField(/Marca|Marcas/i, caseData.brand);
    await this.selectField(/Sucursal|Sucursales/i, caseData.branch);
    await this.selectField(/Agregador|Agregadores/i, caseData.aggregator);
    await this.selectField(/Tipo de men[uú]/i, caseData.menuType);

    const description = this.page.locator('#description').or(this.page.getByPlaceholder(/Ingresa una descripci[oó]n/i)).first();
    await expect(description, 'Debe existir el campo de descripcion para la carga').toBeVisible();
    await description.fill(caseData.description);

    const button = this.page.getByRole('button', { name: /Cargar Men[uú]/i }).first();
    await expect(button, 'Debe estar disponible el boton Cargar Menu').toBeEnabled();
    await button.click();

    const acceptedNotification = this.visibleNotification(caseData.expectedMessage);
    const endpointTimeoutNotification = this.visibleNotification(/Endpoint request timed out/i);
    const finalNotification = acceptedNotification.or(endpointTimeoutNotification).first();

    await expect(
      finalNotification,
      'El portal debe confirmar la carga o informar el timeout conocido del endpoint',
    ).toBeVisible({ timeout: FILE_OPERATION_TIMEOUT_MS });

    const notification = (await finalNotification.innerText()).trim();
    return {
      status: /Endpoint request timed out/i.test(notification) ? 'endpoint-timeout' : 'accepted',
      notification,
    };
  }

  async loadFilters(caseData: FilterLoadFormData, filePath: string): Promise<void> {
    await this.selectField(/Pa[iÃ­]s|Pa[iÃ­]ses/i, caseData.country);
    await this.selectField(/Marca|Marcas/i, caseData.brand);

    if (caseData.aggregator) {
      await this.selectField(/Agregador|Agregadores/i, caseData.aggregator);
    }

    await this.selectField(/Tipo de men[uÃº]|Tipo men[uÃº]/i, caseData.childMenuType ?? caseData.menuType);

    await this.selectField(/Tipo de carga/i, caseData.loadType);
    await this.selectField(/Versionar men[uÃº]|Versionar menu/i, caseData.versionMenu);

    const description = this.page.locator('#description').or(this.page.getByPlaceholder(/Ingresa una descripci[oÃ³]n/i)).first();
    await expect(description, 'Debe existir el campo de descripcion para la carga de filtros').toBeVisible();
    await description.fill(caseData.description);

    await this.uploadTemplateFile(filePath);

    const button = this.page.getByRole('button', { name: /Cargar filtros/i }).first();
    await expect(button, 'Debe estar disponible el boton Cargar filtros').toBeEnabled();
    const [response] = await Promise.all([
      this.page.waitForResponse((candidate) =>
        candidate.request().method() === 'POST'
        && /\/menudelivery\/filters\b/i.test(candidate.url()),
        { timeout: FILE_OPERATION_TIMEOUT_MS },
      ),
      button.click(),
    ]);

    expect(
      response.ok(),
      `El servicio de carga de filtros debe responder correctamente. Status: ${response.status()}`,
    ).toBe(true);

    const notification = this.visibleNotification(caseData.expectedMessage);
    if (await notification.count()) {
      await expect(notification, 'El portal debe mostrar la notificacion de carga de filtros').toBeVisible();
    }
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

  private async openLoadMenuPage(): Promise<void> {
    const loadMenuLink = this.page.getByRole('link', { name: /Carga de Men[uú]|Cargar Men[uú]/i }).first();

    await expect(loadMenuLink, 'Debe existir el link Carga de Menu en Administracion de Menu').toBeVisible();
    await loadMenuLink.click();

    await expect(
      this.page.getByRole('button', { name: /Cargar Men[uú]/i }).first(),
      'Debe mostrarse el formulario de carga de menu',
    ).toBeVisible();
  }

  private async openFilterLoadPage(): Promise<void> {
    const filterLoadLink = this.page.getByRole('link', { name: /Carga de filtros|Cargar filtros/i }).first();

    await expect(filterLoadLink, 'Debe existir el link Carga de filtros en Administracion de Menu').toBeVisible();
    await filterLoadLink.click();

    await expect(
      this.page.getByRole('button', { name: /Cargar filtros/i }).first(),
      'Debe mostrarse el formulario de carga de filtros',
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

  private async selectField(
    label: RegExp,
    value: string | string[],
    exact = false,
    expectedLabel?: string,
  ): Promise<void> {
    const values = Array.isArray(value) ? value : [value];
    const field = this.field(label);
    await expect(field, `Debe existir el selector ${label}`).toBeVisible();
    await expect(field, `El selector ${label} debe terminar de cargar`).not.toHaveClass(/ant-select-loading/);

    if (!(await this.fieldContainsValue(field, values))) {
      if (await this.isNativeSelect(field)) {
        await this.selectNativeOption(field, values);
      } else {
        await this.selectAutocompleteOption(field, values, label);
      }
    }

    if (exact) {
      const expectedValues = expectedLabel ? [expectedLabel] : values;
      await expect
        .poll(() => this.fieldEqualsValue(field, expectedValues), {
          message: `El selector ${label} debe mostrar exactamente ${expectedValues.join(' o ')}`,
        })
        .toBe(true);
    }
  }

  private async setDownloadDate(value: string): Promise<void> {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) {
      throw new Error(`La fecha de descarga debe tener formato DD/MM/YYYY. Valor recibido: ${value}`);
    }

    const [, day, month, year] = match;
    const targetMonth = Number(month) - 1;
    const targetYear = Number(year);
    const targetCellTitle = `${year}-${month}-${day}`;
    const input = this.page
      .locator('.ant-picker input, input[placeholder*="DD/MM/YYYY"], input[type="date"]')
      .filter({ visible: true })
      .first();

    await expect(input, 'Debe existir el campo de fecha para descargar la plantilla').toBeVisible();
    await input.click();

    const calendar = this.page.locator('.ant-picker-dropdown:visible').first();
    await expect(calendar, 'Debe abrirse el calendario de fecha').toBeVisible();

    const firstVisibleDate = calendar.locator('.ant-picker-cell-in-view[title]').first();
    await expect(firstVisibleDate, 'El calendario debe mostrar fechas seleccionables').toBeVisible();
    const visibleDateTitle = await firstVisibleDate.getAttribute('title');
    const visibleDateMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(visibleDateTitle ?? '');
    if (!visibleDateMatch) {
      throw new Error(`No se pudo determinar el mes visible del calendario. Fecha encontrada: ${visibleDateTitle ?? 'sin valor'}`);
    }

    const visibleYear = Number(visibleDateMatch[1]);
    const visibleMonth = Number(visibleDateMatch[2]) - 1;
    const monthDifference = (targetYear - visibleYear) * 12 + targetMonth - visibleMonth;
    const navigationButton = monthDifference < 0
      ? calendar.locator('.ant-picker-header-prev-btn')
      : calendar.locator('.ant-picker-header-next-btn');

    for (let index = 0; index < Math.abs(monthDifference); index += 1) {
      await navigationButton.click();
    }

    const targetCell = calendar.locator(`.ant-picker-cell-in-view[title="${targetCellTitle}"]`).first();
    await expect(targetCell, `Debe existir la fecha ${value} en el calendario`).toBeVisible();
    await targetCell.click();
    await expect(input, 'La fecha de descarga debe conservar el valor esperado').toHaveValue(value);
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

    if (this.matchesLabel(label, ['Agregador', 'Agregadores'])) {
      return this.antSelectByInputId('aggregator');
    }

    if (this.matchesLabel(label, ['Tipo de menu', 'Tipo de menú', 'Tipo menu', 'Tipo menú'])) {
      return this.antSelectByInputId('menuType');
    }

    if (this.matchesLabel(label, ['Tipo de carga'])) {
      return this.filterLoadAntSelectAt(4);
    }

    if (this.matchesLabel(label, ['Versionar menu', 'Versionar menÃº'])) {
      return this.filterLoadAntSelectAt(5);
    }

    return this.page.locator('__no_known_ant_field__');
  }

  private antSelectByInputId(inputId: string): Locator {
    return this.page.locator('.ant-select').filter({
      has: this.page.locator(`input#${inputId}`),
    }).first();
  }

  private filterLoadAntSelectAt(index: number): Locator {
    return this.page.locator('.ant-tabs-tabpane-active .ant-select:visible').nth(index);
  }

  private matchesLabel(label: RegExp, candidates: string[]): boolean {
    return candidates.some((candidate) => label.test(candidate));
  }

  private async isNativeSelect(locator: Locator): Promise<boolean> {
    return locator
      .evaluate((element) => element.tagName.toLowerCase() === 'select')
      .catch(() => false);
  }

  private async selectAutocompleteOption(field: Locator, values: string[], label: RegExp): Promise<void> {
    const attempts = 3;
    let lastRetryableError: Error | undefined;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const option = await this.findAutocompleteOption(field, values, label);
        await expect(option, `Debe mantenerse visible la opcion seleccionable para ${label}`).toBeVisible();
        await option.click();
        await expect
          .poll(() => this.fieldContainsValue(field, values), {
            message: `El selector ${label} debe mostrar el valor seleccionado`,
          })
          .toBe(true);
        return;
      } catch (error) {
        if (!isRetryableAutocompleteError(error) || attempt === attempts) {
          throw error;
        }

        lastRetryableError = error as Error;
      }
    }

    throw new Error(`No fue posible seleccionar ${values.join(', ')} en ${label} despues de ${attempts} intentos. ${lastRetryableError?.message ?? ''}`);
  }

  private async findAutocompleteOption(field: Locator, values: string[], label: RegExp): Promise<Locator> {
    const failures: string[] = [];

    for (const value of values) {
      for (const searchValue of this.searchQueriesForValue(value)) {
        await field.click();
        await this.typeIntoCombobox(field, searchValue);
        await expect(this.visibleDropdown(), `Debe abrirse el dropdown filtrado de ${label}`).toBeVisible();
        await expect(this.visibleAntOptions().or(this.visibleRoleOptions()), `Debe existir al menos una opcion visible para ${label}`).not.toHaveCount(0);

        const matched = await this.matchVisibleOption(value);
        if (matched.status === 'found') {
          return matched.option;
        }

        failures.push(`Buscando "${searchValue}": ${matched.message}`);
      }
    }

    throw new NonRetryableAutocompleteError(`No se encontro una opcion valida para ${label}. Valores buscados: ${values.join(', ')}. ${failures.join(' | ')}`);
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
    const optionTexts = await this.visibleOptionsForMatching().evaluateAll((options) =>
      options.map((option, index) => ({
        index,
        text: (option.textContent || '').trim(),
        title: option.getAttribute('title') || '',
        ariaLabel: option.getAttribute('aria-label') || '',
      })),
    );
    const normalizedValue = normalizeForComparison(value);
    const exact = optionTexts.filter((option) =>
      optionValues(option).some((text) => normalizeForComparison(text) === normalizedValue),
    );

    if (exact.length === 1) {
      return { status: 'found', option: this.locatorForExactOption(exact[0]) };
    }

    if (exact.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide exactamente con multiples opciones: ${exact.map(optionDisplayName).join(', ')}`,
      };
    }

    const trailingCode = optionTexts.filter((option) =>
      optionValues(option).some((text) => matchesExactTrailingCode(text, value)),
    );

    if (trailingCode.length === 1) {
      return { status: 'found', option: this.locatorForExactOption(trailingCode[0]) };
    }

    if (trailingCode.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide con multiples codigos exactos al final: ${trailingCode.map(optionDisplayName).join(', ')}`,
      };
    }

    const termMatches = this.matchOptionsByTerms(optionTexts, value);
    if (termMatches.length === 1) {
      return { status: 'found', option: this.locatorForExactOption(termMatches[0]) };
    }

    if (termMatches.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide con multiples opciones por terminos: ${termMatches.map(optionDisplayName).join(', ')}`,
      };
    }

    const partial = optionTexts.filter((option) =>
      optionValues(option).some((text) => normalizeForComparison(text).includes(normalizedValue)),
    );

    if (partial.length === 1) {
      return { status: 'found', option: this.locatorForExactOption(partial[0]) };
    }

    if (partial.length > 1) {
      return {
        status: 'ambiguous',
        message: `El valor "${value}" coincide con multiples opciones: ${partial.map(optionDisplayName).join(', ')}`,
      };
    }

    return {
      status: 'missing',
      message: `El valor "${value}" no coincide con opciones visibles: ${optionTexts.map(optionDisplayName).join(', ') || 'sin opciones'}`,
    };
  }

  private matchOptionsByTerms(
    options: VisibleOptionData[],
    value: string,
  ): VisibleOptionData[] {
    const terms = this.significantTerms(value);

    if (terms.length < 2) {
      return [];
    }

    return options.filter((option) =>
      optionValues(option).some((text) => {
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

  private async uploadTemplateFile(filePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]').first();

    await expect(fileInput, 'Debe existir el control para adjuntar la plantilla editada').toHaveCount(1);
    await fileInput.setInputFiles(filePath, { timeout: FILE_OPERATION_TIMEOUT_MS });
  }

  private async fieldContainsValue(field: Locator, values: string[]): Promise<boolean> {
    const currentText = await field.evaluate((element) => {
      const htmlElement = element as HTMLElement;
      const input = element instanceof HTMLInputElement ? element : htmlElement.querySelector('input');
      const antSelect = htmlElement.closest('.ant-select') as HTMLElement | null;

      return [
        htmlElement.textContent,
        input?.value,
        input?.getAttribute('aria-label'),
        input?.getAttribute('placeholder'),
        antSelect?.textContent,
      ].filter(Boolean).join(' ');
    }).catch(() => '');
    const normalizedCurrentText = normalizeForComparison(currentText || '');

    return values.some((value) => normalizedCurrentText.includes(normalizeForComparison(value)));
  }

  private async fieldEqualsValue(field: Locator, values: string[]): Promise<boolean> {
    const currentValue = await field.evaluate((element) => {
      const htmlElement = element as HTMLElement;
      const nativeSelect = element instanceof HTMLSelectElement ? element : null;
      const selectedItem = htmlElement.querySelector('.ant-select-selection-item');
      const input = element instanceof HTMLInputElement ? element : htmlElement.querySelector('input');

      return nativeSelect?.selectedOptions[0]?.text
        || selectedItem?.getAttribute('title')
        || selectedItem?.textContent
        || input?.value
        || '';
    }).catch(() => '');
    const normalizedCurrentValue = normalizeForComparison(currentValue);

    return values.some((value) => normalizedCurrentValue === normalizeForComparison(value));
  }

  private visibleDropdown(): Locator {
    return this.page.locator('.ant-select-dropdown:visible').first();
  }

  private visibleAntOptions(): Locator {
    return this.page.locator('.ant-select-dropdown:visible .ant-select-item-option');
  }

  private visibleRoleOptions(): Locator {
    return this.page.locator('[role="listbox"]:visible [role="option"]:visible');
  }

  private visibleOptionsForMatching(): Locator {
    return this.visibleAntOptions().or(this.visibleRoleOptions());
  }

  private locatorForExactOption(option: VisibleOptionData): Locator {
    const candidates = optionValues(option).filter(Boolean);
    const visibleOptions = this.visibleOptionsForMatching();
    const locators = candidates.map((candidate) => {
      const pattern = exactTextPattern(candidate);

      return visibleOptions
        .filter({ hasText: pattern })
        .or(this.page.locator(`.ant-select-dropdown:visible .ant-select-item-option[title=${cssString(candidate)}]`))
        .or(this.page.locator(`[role="listbox"]:visible [role="option"][aria-label=${cssString(candidate)}]:visible`));
    });

    return locators.reduce((locator, next) => locator.or(next));
  }

  private successMessage(pattern: RegExp): Locator {
    return this.page
      .getByRole('alert')
      .filter({ hasText: pattern })
      .or(this.page.getByText(pattern))
      .first();
  }

  private async expectVisibleNotification(
    message: RegExp,
    assertionMessage: string,
    timeout?: number,
  ): Promise<void> {
    const notification = this.visibleNotification(message);

    await expect(notification, assertionMessage).toHaveCount(1, { timeout });
    await expect(notification, assertionMessage).toBeVisible();
  }

  private visibleNotification(message: RegExp): Locator {
    return this.page.locator('[role="alert"]:visible').filter({ hasText: message });
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

function exactTextPattern(value: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`, 'i');
}

function cssString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function optionValues(option: VisibleOptionData): string[] {
  return [option.text, option.title, option.ariaLabel].filter(Boolean);
}

function optionDisplayName(option: VisibleOptionData): string {
  return option.text || option.title || option.ariaLabel;
}

function matchesExactTrailingCode(optionText: string, value: string): boolean {
  const normalizedValue = normalizeForComparison(value);
  const normalizedText = normalizeForComparison(optionText);
  const lastDashIndex = normalizedText.lastIndexOf('-');

  if (lastDashIndex === -1) {
    return false;
  }

  return normalizedText.slice(lastDashIndex + 1).trim() === normalizedValue;
}

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

class NonRetryableAutocompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableAutocompleteError';
  }
}

function isRetryableAutocompleteError(error: unknown): boolean {
  if (error instanceof NonRetryableAutocompleteError) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);

  return /Timeout|not visible|detached|closed|not attached|Element is not attached|intercepts pointer events|Target page, context or browser has been closed/i.test(message);
}
