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

  async validateTemplateExpectation(expectation: CoreViewerTemplateExpectation): Promise<void> {
    await this.search(expectation.categoryName);
    await this.expectVisiblePageText(expectation.categoryName, 'Debe visualizarse la categoria registrada en la plantilla');
    await this.openVisibleResult(expectation.categoryName);

    await this.search(expectation.itemName);
    await this.expectVisiblePageText(expectation.itemName, 'Debe visualizarse el item registrado en la plantilla');
    await this.openVisibleResult(expectation.itemName);
    await expect(this.productPreview(), 'Debe abrirse la previsualizacion del producto').toBeVisible();
    await this.expandTreeCompletely();
    await this.expectVisiblePreviewText(expectation.itemName, 'Debe visualizarse el nombre del item en la previsualizacion');
    await this.expectVisiblePreviewText(expectation.itemDescription, 'Debe visualizarse la descripcion del item registrada en la plantilla');

    await this.expectGroupVisible(expectation.groupName, expectation);
    await this.expectVisiblePreviewText(expectation.groupDescription, 'Debe visualizarse la descripcion del grupo modificador editado');

    for (const modifier of expectation.modifiers) {
      await this.expectVisiblePreviewText(modifier.name, `Debe visualizarse el modificador ${modifier.id}`);
    }

    await this.expectVisualOrder(
      [expectation.groupName],
      `El grupo modificador ${expectation.groupId} debe estar disponible para validar orden ${expectation.groupOrder}`,
    );
    await this.expectVisualOrder(
      expectation.modifiers.map(modifier => modifier.name),
      'Los modificadores deben visualizarse en el orden definido por la columna Orden de la plantilla',
    );
  }

  async collectDiagnostic(
    filters: CoreViewerFilters,
    expectation: CoreViewerTemplateExpectation,
  ): Promise<CoreViewerDiagnostic> {
    await this.expandTreeCompletely().catch(() => undefined);
    const groupsFound = await this.visibleGroupNames();
    const domInfo = await this.productPreview().evaluate((root, expectedGroupId) => {
      const tree = root.querySelector('[role="tree"], .ant-tree');
      const all = Array.from(root.querySelectorAll('*'));
      const textOf = (element: Element) => (element.textContent || '').replace(/\s+/g, ' ').trim();
      const expectedIdInDom = all.some((element) =>
        textOf(element).includes(expectedGroupId)
        || Array.from(element.attributes).some(attribute => attribute.value.includes(expectedGroupId)));
      const internalScrollContainers = all
        .filter(element => element.scrollHeight > element.clientHeight + 2)
        .map(element => ({
          tag: element.tagName,
          className: typeof (element as HTMLElement).className === 'string'
            ? (element as HTMLElement).className
            : '',
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        }));

      return {
        expectedIdInDom,
        treeHadCollapsedNodes: root.querySelectorAll('.ant-tree-switcher_close, .rc-tree-switcher_close').length > 0,
        treeScroll: tree
          ? { clientHeight: tree.clientHeight, scrollHeight: tree.scrollHeight, scrollTop: tree.scrollTop }
          : null,
        internalScrollContainers,
      };
    }, expectation.groupId);

    return {
      context: filters,
      product: `${expectation.itemId} - ${expectation.itemName}`,
      expectedGroupName: expectation.groupName,
      expectedGroupId: expectation.groupId,
      expectedTemplate: expectation.inputPath,
      groupsFound,
      expectedNameInTree: groupsFound.includes(expectation.groupName),
      expectedIdInDom: domInfo.expectedIdInDom,
      treeHadCollapsedNodes: domInfo.treeHadCollapsedNodes,
      treeScroll: domInfo.treeScroll,
      internalScrollContainers: domInfo.internalScrollContainers,
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
    await result.click().catch(() => undefined);
    await this.waitForLoadingToFinish();
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

  private async expectGroupVisible(value: string, expectation: CoreViewerTemplateExpectation): Promise<void> {
    const group = this.productPreview().getByRole('heading', { name: exactTextPattern(value) });
    const visibleGroupNames = await this.visibleGroupNames();

    if (await group.count()) {
      await expect(group, 'Debe visualizarse el grupo modificador editado').toBeVisible();
      return;
    }

    throw new Error([
      'Debe visualizarse el grupo modificador editado.',
      `Grupo esperado: ${value}`,
      `Grupo ID: ${expectation.groupId}`,
      `Producto: ${expectation.itemId} - ${expectation.itemName}`,
      `Archivo: ${expectation.inputPath}`,
      `Grupos visibles encontrados: ${JSON.stringify(visibleGroupNames)}`,
    ].join('\n'));
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

  private async expandTreeCompletely(): Promise<void> {
    const preview = this.productPreview();
    const tree = preview.getByRole('tree');
    await expect(tree, 'Debe existir el arbol de grupos modificadores en la previsualizacion').toBeVisible();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const closedSwitchers = preview.locator('.ant-tree-switcher_close, .rc-tree-switcher_close');
      const count = await closedSwitchers.count();
      if (count === 0) break;

      for (let index = 0; index < count; index += 1) {
        const switcher = closedSwitchers.nth(index);
        if (await switcher.isVisible().catch(() => false)) {
          await switcher.click();
        }
      }

      await this.waitForLoadingToFinish();
    }

    await expect(preview.locator('.ant-tree-switcher_close, .rc-tree-switcher_close')).toHaveCount(0);
    await this.scrollTreeAndDrawerCompletely();
  }

  private async scrollTreeAndDrawerCompletely(): Promise<void> {
    await this.productPreview().evaluate(async (root) => {
      const containers = Array.from(root.querySelectorAll('*'))
        .filter(element => element.scrollHeight > element.clientHeight + 2) as HTMLElement[];
      const scrollables = [root as HTMLElement, ...containers];

      for (const element of scrollables) {
        element.scrollTop = 0;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
        await new Promise(requestAnimationFrame);

        while (element.scrollTop + element.clientHeight < element.scrollHeight - 2) {
          const previous = element.scrollTop;
          element.scrollTop = Math.min(element.scrollTop + element.clientHeight, element.scrollHeight);
          element.dispatchEvent(new Event('scroll', { bubbles: true }));
          await new Promise(requestAnimationFrame);
          if (element.scrollTop === previous) break;
        }

        element.scrollTop = 0;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
        await new Promise(requestAnimationFrame);
      }
    });
  }

  async visibleGroupNames(): Promise<string[]> {
    const preview = this.productPreview();

    return preview.getByRole('tree').getByRole('heading', { level: 6 }).evaluateAll((headings) =>
      headings.map(heading => (heading.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
    ).catch(() => []);
  }

  private async expectVisualOrder(values: string[], message: string): Promise<void> {
    const positions: number[] = [];

    for (const value of values) {
      const locator = this.previewText(value);
      await expect(locator, message).toBeVisible();
      const box = await locator.boundingBox();
      if (!box) {
        throw new Error(`No fue posible obtener la posicion visual de "${value}".`);
      }
      positions.push(box.y);
    }

    const sorted = [...positions].sort((left, right) => left - right);
    expect(positions, message).toEqual(sorted);
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
