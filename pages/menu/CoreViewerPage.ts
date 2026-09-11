import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import type { CoreViewerTemplateExpectation } from '@utils/core-viewer-template';

export type CoreViewerFilters = {
  country: string | string[];
  brand: string | string[];
  aggregator: string | string[];
  branch: string | string[];
};

export type CoreViewerDiagnostic = {
  context: CoreViewerFilters;
  product: string;
  expectedGroupName: string;
  expectedGroupId: string;
  expectedTemplate: string;
  previewVisible: boolean;
  jsonVisible: boolean;
  jsonText?: string;
  groupsFound: string[];
  expectedNameInTree: boolean;
  expectedIdInDom: boolean;
  treeHadCollapsedNodes: boolean;
  treeScroll: {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
  } | null;
  internalScrollContainers: Array<{
    tag: string;
    className: string;
    clientHeight: number;
    scrollHeight: number;
  }>;
  timestamp: string;
};

type VisibleCardData = {
  index: number;
  text: string;
};

export class CoreViewerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.openApplicationLauncher();
    await this.openMenuSection();
    await this.openCoreViewerPage();
    await expect(
      this.page.getByText(/Visor Core/i).first(),
      'Debe mostrarse la pantalla Visor CORE',
    ).toBeVisible();
  }

  async applyFilters(filters: CoreViewerFilters): Promise<void> {
    await this.selectCard(filters.country, 'Pais');
    await this.selectCard(filters.brand, 'Marca');
    await this.selectCard(filters.aggregator, 'Agregador');
    await this.selectCard(filters.branch, 'Sucursal');
  }

  async validateTemplateExpectation(expectation: CoreViewerTemplateExpectation): Promise<string> {
    await this.search(expectation.categoryName);
    await this.expectVisiblePageText(expectation.categoryName, 'Debe visualizarse la categoria registrada en la plantilla');
    await this.openVisibleResult(expectation.categoryName);

    await this.search(expectation.itemName);
    await this.openExpectedProduct(expectation);
    await expect(this.productPreview(), 'Debe abrirse la previsualizacion del producto').toBeVisible();
    await this.expectVisiblePreviewText(expectation.itemName, 'Debe visualizarse el nombre del item en la previsualizacion');
    await this.expectVisiblePreviewText(expectation.itemDescription, 'Debe visualizarse la descripcion del item registrada en la plantilla');
    const jsonText = await this.openJsonView();
    this.validateJsonExpectation(jsonText, expectation);
    return jsonText;
  }

  async collectDiagnostic(
    filters: CoreViewerFilters,
    expectation: CoreViewerTemplateExpectation,
  ): Promise<CoreViewerDiagnostic> {
    const previewVisible = await this.productPreview().isVisible().catch(() => false);

    if (!previewVisible) {
      return {
        context: filters,
        product: `${expectation.itemId} - ${expectation.itemName}`,
        expectedGroupName: expectation.groupName,
        expectedGroupId: expectation.groupId,
        expectedTemplate: expectation.inputPath,
        previewVisible: false,
        jsonVisible: false,
        jsonText: undefined,
        groupsFound: [],
        expectedNameInTree: false,
        expectedIdInDom: false,
        treeHadCollapsedNodes: false,
        treeScroll: null,
        internalScrollContainers: [],
        timestamp: new Date().toISOString(),
      };
    }

    const json = this.jsonContent();
    const jsonVisible = await json.isVisible().catch(() => false);
    const jsonText = jsonVisible ? await json.textContent() ?? '' : '';
    const groupsFound = jsonText.includes(expectation.groupName) ? [expectation.groupName] : [];

    return {
      context: filters,
      product: `${expectation.itemId} - ${expectation.itemName}`,
      expectedGroupName: expectation.groupName,
      expectedGroupId: expectation.groupId,
      expectedTemplate: expectation.inputPath,
      previewVisible: true,
      jsonVisible,
      jsonText: jsonVisible ? jsonText : undefined,
      groupsFound,
      expectedNameInTree: groupsFound.includes(expectation.groupName),
      expectedIdInDom: jsonText.includes(expectation.groupId),
      treeHadCollapsedNodes: false,
      treeScroll: null,
      internalScrollContainers: [],
      timestamp: new Date().toISOString(),
    };
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
    await expect(this.rootApplicationMenu(), 'Debe desplegarse el menu de aplicaciones').toBeVisible();
  }

  private async openMenuSection(): Promise<void> {
    const menuSection = this.rootApplicationMenu()
      .getByRole('menuitem', { name: /menu\s+Men[uú]/i })
      .or(this.rootApplicationMenu().locator('[role="menuitem"]').filter({ hasText: /^\s*Men/i }))
      .first();

    await expect(menuSection, 'Debe existir la seccion Menu dentro del launcher abierto').toBeVisible();
    await menuSection.hover();
    await expect(this.visibleSubmenuItem(/Visor CORE/i), 'Debe mostrarse la opcion Visor CORE').toBeVisible();
  }

  private async openCoreViewerPage(): Promise<void> {
    const coreViewerOption = this.visibleSubmenuItem(/Visor CORE/i);

    await expect(coreViewerOption, 'Debe existir la opcion Visor CORE en el submenu Menu').toBeVisible();
    await coreViewerOption.click();
    await this.page.waitForURL(/\/menu\/visor-core\/?$/, { waitUntil: 'commit', timeout: 5_000 })
      .catch(async () => {
        await this.page.goto('/menu/visor-core/', { waitUntil: 'commit' });
      });
  }

  private async selectCard(value: string | string[], stepName: string): Promise<void> {
    const values = Array.isArray(value) ? value : [value];
    const attempts = 3;
    let lastMessage = '';

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      for (const candidate of values) {
        await this.clearSearch();
        await this.waitForLoadingToFinish();
        await this.waitForVisibleCards();
        let match = await this.matchVisibleCard(candidate);

        if (match.status === 'found') {
          await this.selectMatchedCard(match.card, candidate, stepName);
          return;
        }

        await this.search(candidate);
        await this.waitForVisibleCards().catch(() => undefined);
        match = await this.matchVisibleCard(candidate);

        if (match.status === 'found') {
          await this.selectMatchedCard(match.card, candidate, stepName);
          return;
        }

        lastMessage = match.message;
      }

      await this.clearSearch();
      await this.waitForLoadingToFinish();
    }

    throw new Error(`No se pudo seleccionar ${stepName}. Valores buscados: ${values.join(', ')}. ${lastMessage}`);
  }

  private async selectMatchedCard(card: Locator, candidate: string, stepName: string): Promise<void> {
    await expect(card, `Debe existir la tarjeta ${candidate} para ${stepName}`).toBeVisible();
    await card.click();
    await this.clearSearch();
    await this.waitForLoadingToFinish();
    if (await card.isVisible().catch(() => false)) {
      await expect(card, `La tarjeta ${candidate} debe quedar seleccionada`).toHaveClass(/card-selectable-blue/);
    }
  }

  private async search(value: string): Promise<void> {
    const input = this.page.getByPlaceholder(/Buscar/i).first();
    await expect(input, 'Debe existir el buscador del Visor CORE').toBeVisible();
    await input.fill(value);
    await this.waitForLoadingToFinish();
  }

  private async clearSearch(): Promise<void> {
    const input = this.page.getByPlaceholder(/Buscar/i).first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill('');
    }
  }

  private async openVisibleResult(value: string): Promise<void> {
    const result = this.pageText(value);
    await expect(result, `Debe existir el resultado ${value}`).toBeVisible();
    await result.click();
    await this.waitForLoadingToFinish();
  }

  private async openExpectedProduct(expectation: CoreViewerTemplateExpectation): Promise<void> {
    const cards = this.productCards().filter({
      has: this.page.getByText(exactTextPattern(expectation.itemName)),
    });
    await expect
      .poll(() => cards.count(), {
        message: `Debe existir el producto ${expectation.itemId} - ${expectation.itemName}`,
      })
      .toBeGreaterThan(0);

    const visibleCards = await cards.evaluateAll(elements => elements.map((element, index) => ({
      index,
      text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
    })));
    const expectedPrices = expectation.itemPrices.map(formatPrice);
    let matches = expectedPrices.length > 0
      ? visibleCards.filter(card => expectedPrices.some(price => card.text.includes(price)))
      : visibleCards;

    if (matches.length > 1 && expectation.itemDaypart) {
      const expectedDaypart = normalizeForComparison(expectation.itemDaypart);
      matches = matches.filter(card => normalizeForComparison(card.text).includes(expectedDaypart));
    }

    if (matches.length !== 1) {
      throw new Error([
        `No fue posible identificar de forma unica el producto ${expectation.itemId} - ${expectation.itemName}.`,
        `Precios esperados: ${expectedPrices.join(', ') || 'sin precio en la plantilla'}.`,
        `Daypart esperado: ${expectation.itemDaypart || 'sin Daypart en la plantilla'}.`,
        `Coincidencias encontradas: ${JSON.stringify(visibleCards.map(card => card.text))}.`,
      ].join('\n'));
    }

    const product = cards.nth(matches[0].index);
    await expect(product, `Debe visualizarse el producto ${expectation.itemId}`).toBeVisible();
    await product.click();
    await this.waitForLoadingToFinish();
  }

  private async openJsonView(): Promise<string> {
    const preview = this.productPreview();
    const viewJson = preview
      .locator('.ant-typography.text-primary.selectable')
      .filter({ hasText: exactTextPattern('Ver JSON') })
      .first();
    await expect(viewJson, 'Debe existir la accion Ver JSON en la previsualizacion').toBeVisible();
    await viewJson.click();

    const json = this.jsonContent();
    await expect(json, 'Debe abrirse el JSON del producto seleccionado').toBeVisible();
    return await json.textContent() ?? '';
  }

  private validateJsonExpectation(
    jsonText: string,
    expectation: CoreViewerTemplateExpectation,
  ): void {
    const expectedValues = [
      { label: 'item', value: expectation.itemId },
      { label: 'nombre del item', value: expectation.itemName },
      { label: 'descripcion del item', value: expectation.itemDescription },
      { label: 'grupo modificador', value: expectation.groupId },
      { label: 'nombre del grupo modificador', value: expectation.groupName },
      { label: 'descripcion del grupo modificador', value: expectation.groupDescription },
      ...expectation.modifiers.flatMap(modifier => [
        { label: `modificador ${modifier.id}`, value: modifier.id },
        { label: `nombre del modificador ${modifier.id}`, value: modifier.name },
      ]),
    ];

    for (const expected of expectedValues) {
      expect(
        jsonText.includes(expected.value),
        `El JSON debe contener ${expected.label}: ${expected.value}`,
      ).toBe(true);
    }

    const modifierPositions = expectation.modifiers.map(modifier => jsonText.indexOf(modifier.name));
    const sortedPositions = [...modifierPositions].sort((left, right) => left - right);
    expect(
      modifierPositions,
      'Los modificadores deben conservar en el JSON el orden definido en la plantilla',
    ).toEqual(sortedPositions);
  }

  private async matchVisibleCard(value: string): Promise<
    | { status: 'found'; card: Locator }
    | { status: 'missing' | 'ambiguous'; message: string }
  > {
    const cards = await this.visibleCards().evaluateAll((elements) =>
      elements.map((element, index) => ({
        index,
        text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
      })),
    );
    const normalizedValue = normalizeForComparison(value);
    const exact = cards.filter(card => normalizeForComparison(card.text) === normalizedValue);

    if (exact.length === 1) {
      return { status: 'found', card: this.cardByText(exact[0], value) };
    }

    if (exact.length > 1) {
      return { status: 'ambiguous', message: `El valor "${value}" coincide exactamente con multiples tarjetas: ${exact.map(card => card.text).join(', ')}` };
    }

    const trailingCode = cards.filter(card =>
      matchesExactTrailingCode(card.text, value) || matchesExactLabeledCode(card.text, value));
    if (trailingCode.length === 1) {
      return { status: 'found', card: this.cardByText(trailingCode[0], value) };
    }

    if (trailingCode.length > 1) {
      return { status: 'ambiguous', message: `El valor "${value}" coincide con multiples codigos exactos al final: ${trailingCode.map(card => card.text).join(', ')}` };
    }

    const partial = cards.filter(card => normalizeForComparison(card.text).includes(normalizedValue));
    if (partial.length === 1) {
      return { status: 'found', card: this.cardByText(partial[0], value) };
    }

    if (partial.length > 1) {
      return { status: 'ambiguous', message: `El valor "${value}" coincide con multiples tarjetas: ${partial.map(card => card.text).join(', ')}` };
    }

    return {
      status: 'missing',
      message: `No hay tarjeta visible para "${value}". Tarjetas visibles: ${cards.map(card => card.text).join(', ') || 'sin tarjetas'}`,
    };
  }

  private visibleCards(): Locator {
    return this.page.locator('.ant-card-grid.selectable');
  }

  private productCards(): Locator {
    return this.page.locator('.ant-card-grid.selectable.p-3');
  }

  private cardByText(card: VisibleCardData, value: string): Locator {
    if (matchesExactLabeledCode(card.text, value)) {
      return this.visibleCards().filter({ hasText: exactLabeledCodePattern(value) }).first();
    }

    return this.visibleCards().filter({ hasText: exactTextPattern(card.text) }).first();
  }

  private async expectVisiblePageText(value: string, message: string): Promise<void> {
    await expect(this.pageText(value), message).toBeVisible();
  }

  private async expectVisiblePreviewText(value: string, message: string): Promise<void> {
    await expect(this.previewText(value), message).toBeVisible();
  }

  private pageText(value: string): Locator {
    return this.page.getByText(exactTextPattern(value));
  }

  private previewText(value: string): Locator {
    return this.productPreview().getByText(exactTextPattern(value));
  }

  private productPreview(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: /Previsualizaci[oó]n/i });
  }

  private jsonContent(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.locator('pre') }).last().locator('pre');
  }

  private async waitForLoadingToFinish(): Promise<void> {
    await expect(this.page.locator('.ant-spin-text', { hasText: /Cargando/i })).toHaveCount(0);
  }

  private async waitForVisibleCards(): Promise<void> {
    await expect(this.visibleCards()).not.toHaveCount(0);
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

function matchesExactTrailingCode(optionText: string, value: string): boolean {
  const normalizedValue = normalizeForComparison(value);
  const normalizedText = normalizeForComparison(optionText);
  const lastDashIndex = normalizedText.lastIndexOf('-');

  if (lastDashIndex === -1) {
    return false;
  }

  return normalizedText.slice(lastDashIndex + 1).trim() === normalizedValue;
}

function matchesExactLabeledCode(optionText: string, value: string): boolean {
  const normalizedValue = normalizeForComparison(value);
  if (!/^\d+$/.test(normalizedValue)) {
    return false;
  }

  const normalizedText = normalizeForComparison(optionText);
  return new RegExp(`(?:CECO|SUCURSAL|CODIGO)\\s*${escapeRegExp(normalizedValue)}(?=\\D|$)`, 'i').test(normalizedText);
}

function exactLabeledCodePattern(value: string): RegExp {
  return new RegExp(`(?:CECO|SUCURSAL|CODIGO)\\s*${escapeRegExp(normalizeForComparison(value))}(?=\\D|$)`, 'i');
}

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
