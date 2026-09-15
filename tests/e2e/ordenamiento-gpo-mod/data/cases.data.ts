import type {
  FilterLoadFormData,
  MenuLoadFormData,
  TemplateDownloadFormData,
} from '@pages/menu/MenuAdministrationPage';
import type { EmailBodyExpectation } from '@src/integrations/google/gmail-client';
import {
  resolveExcelSourceCaseId,
} from './excel-artifact-dependencies';
import {
  getBrand,
  isScenarioEnabled,
  resolveCaseId,
  testDatasets,
  type BrandTag,
  type CaseId,
  type ScenarioId,
  type TestDataset,
} from './datasets.data';

export type { CaseId, ScenarioId, TestDataset } from './datasets.data';

export type CaseMetadata = {
  cp: CaseId;
  id: CaseId;
  scenario: ScenarioId;
  datasetId: string;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  brandTag: BrandTag;
};

export type TemplateDownloadCase = TemplateDownloadFormData & CaseMetadata & {
  scenario: 'downloadTemplate';
  selectDate: boolean;
};

export type TemplateEditCase = CaseMetadata & {
  scenario: 'editTemplate';
  sourceCaseId: CaseId;
  aggregator: string;
  selectionStrategy: 'rotating-eligible-item';
};

export type FilterLoadCase = FilterLoadFormData & CaseMetadata & {
  scenario: 'uploadFilters';
  sourceCaseId: CaseId;
  expectedEmailSubject?: string | RegExp;
  expectedEmailBodyFields?: EmailBodyExpectation[];
};

export type MenuLoadCase = MenuLoadFormData & CaseMetadata & {
  scenario: 'uploadMenu';
  sourceCaseId: CaseId;
  expectedEmailSubject: string | RegExp;
  expectedEmailBodyFields: EmailBodyExpectation[];
};

export type CoreViewerCase = CaseMetadata & {
  scenario: 'validateVisor';
  sourceCaseId: CaseId;
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  aggregator: string | string[];
  menuType: string | string[];
};

export type JsonValidationCase = CaseMetadata & {
  scenario: 'validateJson';
  sourceCaseId: CaseId;
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  aggregator: string | string[];
  menuType: string | string[];
};

export type ReorderCaseBase = CaseMetadata & {
  sourceCaseId: CaseId;
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  aggregator: string | string[];
  menuType: string | string[];
  loadType: string | string[];
  versionMenu: string | string[];
  filterDescription: string;
  menuDescription: string;
  expectedFilterMessage: RegExp;
  expectedMenuMessage: RegExp;
  expectedMenuEmailSubject: string | RegExp;
  expectedMenuEmailBodyFields: EmailBodyExpectation[];
  expectedFilterEmailSubject?: string | RegExp;
  expectedFilterEmailBodyFields?: EmailBodyExpectation[];
};

export type ReorderGroupsCase = ReorderCaseBase & {
  scenario: 'reorderGroups';
};

export type ReorderModifiersCase = ReorderCaseBase & {
  scenario: 'reorderModifiers';
};

export type ReorderGroupsAndModifiersCase = ReorderCaseBase & {
  scenario: 'reorderGroupsAndModifiers';
};

export type UpdateExistingMenuCase = ReorderCaseBase & {
  scenario: 'updateExistingMenu';
};

export type PreserveOrderCase = ReorderCaseBase & {
  scenario: 'preserveOrder';
};

export type MultipleGroupsCase = ReorderCaseBase & {
  scenario: 'multipleGroups';
};

type ScenarioDefinition = {
  number: number;
  title: string;
};

const scenarioDefinitions = {
  downloadTemplate: {
    number: 1,
    title: 'Descarga de plantilla para registro de filtros',
  },
  editTemplate: {
    number: 2,
    title: 'Edicion de plantilla de grupos modificadores y modificadores',
  },
  uploadFilters: {
    number: 3,
    title: 'Cargar filtros para un nuevo menu',
  },
  uploadMenu: {
    number: 4,
    title: 'Carga exitosa de un nuevo menu',
  },
  validateVisor: {
    number: 5,
    title: 'Validacion en Visor CORE',
  },
  validateJson: {
    number: 6,
    title: 'Validacion del JSON',
  },
  reorderGroups: {
    number: 7,
    title: 'Ordenamiento de grupos modificadores',
  },
  reorderModifiers: {
    number: 8,
    title: 'Ordenamiento de modificadores',
  },
  reorderGroupsAndModifiers: {
    number: 9,
    title: 'Ordenamiento de grupos y modificadores',
  },
  updateExistingMenu: {
    number: 10,
    title: 'Modificacion de un menu existente',
  },
  preserveOrder: {
    number: 11,
    title: 'Conservacion del orden configurado',
  },
  multipleGroups: {
    number: 12,
    title: 'Validacion de multiples grupos modificadores',
  },
} as const satisfies Record<ScenarioId, ScenarioDefinition>;

const scenarioDefaults = {
  downloadTemplate: {
    selectDate: false,
  },
  editTemplate: {
    selectionStrategy: 'rotating-eligible-item' as const,
  },
  uploadFilters: {
    loadType: 'Nuevo menú',
    versionMenu: 'No',
  },
  uploadMenu: {
    descriptionPrefix: 'Carga de nuevo menú',
  },
  updateExistingMenu: {
    loadType: 'Actualización',
    versionMenu: 'Si',
  },
} as const;

const requirement = 'OrdenamientoGpoMod&Mod 2.0';
const expectedTemplateRequestMessage = /confirmaci[oó]n|correo|enviad[ao]|plantilla|[eé]xito|correctamente/i;
const expectedFilterLoadMessage = /filtros|correo|enviad[ao]|cargad[ao]|[eé]xito|correctamente/i;
const expectedMenuLoadMessage = /El men[uú]\s+se est[aá]\s+cargando correctamente\.?/i;
const expectedFilterLoadEmailSubject = /carga\s+de\s+la\s+plantilla\s+desarrollo/i;
const expectedMenuLoadEmailSubject = 'Carga de menu - Desarrollo';

export const downloadTemplateCases: TemplateDownloadCase[] = enabledDatasets('downloadTemplate')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const override = dataset.overrides?.downloadTemplate;
    const downloadDate = override?.date;

    return {
      ...metadata(dataset, 'downloadTemplate'),
      scenario: 'downloadTemplate',
      country: dataset.country,
      brand: brand.label,
      baseBranch: dataset.branch.code,
      menuType: dataset.menuType,
      selectDate: downloadDate ? true : scenarioDefaults.downloadTemplate.selectDate,
      downloadDate,
      exactSelections: override?.exactSelections,
      expectedBaseBranchLabel: override?.exactSelections ? dataset.branch.label : undefined,
      expectedMessage: expectedTemplateRequestMessage,
    };
  });

export const editTemplateCases: TemplateEditCase[] = enabledDatasets('editTemplate')
  .map(dataset => ({
    ...metadata(dataset, 'editTemplate'),
    scenario: 'editTemplate',
    sourceCaseId: sourceCaseId(dataset, 'editTemplate'),
    aggregator: dataset.aggregator,
    selectionStrategy: scenarioDefaults.editTemplate.selectionStrategy,
  }));

export const uploadFiltersCases: FilterLoadCase[] = enabledDatasets('uploadFilters')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'uploadFilters');

    return {
      ...caseMetadata,
      scenario: 'uploadFilters',
      sourceCaseId: sourceCaseId(dataset, 'uploadFilters'),
      country: dataset.country,
      brand: brand.label,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.uploadFilters.loadType,
      versionMenu: scenarioDefaults.uploadFilters.versionMenu,
      description: `Carga de filtros ${caseMetadata.id}`,
      expectedMessage: expectedFilterLoadMessage,
      ...uploadFilterEmailExpectations(dataset, brand.label),
    };
  });

export const uploadMenuCases: MenuLoadCase[] = enabledDatasets('uploadMenu')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'uploadMenu');

    return {
      ...caseMetadata,
      scenario: 'uploadMenu',
      sourceCaseId: sourceCaseId(dataset, 'uploadMenu'),
      country: dataset.country,
      brand: brand.label,
      branch: dataset.branch.label,
      aggregator: dataset.aggregator,
      menuType: dataset.menuType,
      description: `${scenarioDefaults.uploadMenu.descriptionPrefix} ${caseMetadata.id}`,
      expectedMessage: expectedMenuLoadMessage,
      expectedEmailSubject: expectedMenuLoadEmailSubject,
      expectedEmailBodyFields: menuLoadEmailBodyFields(
        brand.label,
        displayAggregator(dataset.aggregator),
        dataset.branch.code,
      ),
    };
  });

export const validateVisorCases: CoreViewerCase[] = enabledDatasets('validateVisor')
  .map(dataset => buildViewerCase(dataset, 'validateVisor'));

export const validateJsonCases: JsonValidationCase[] = enabledDatasets('validateJson')
  .map(dataset => buildViewerCase(dataset, 'validateJson'));

export const reorderGroupsCases: ReorderGroupsCase[] = buildReorderCases(
  'reorderGroups',
  'Ordenamiento de grupos',
);

export const reorderModifiersCases: ReorderModifiersCase[] = buildReorderCases(
  'reorderModifiers',
  'Ordenamiento de modificadores',
);

export const reorderGroupsAndModifiersCases: ReorderGroupsAndModifiersCase[] = buildReorderCases(
  'reorderGroupsAndModifiers',
  'Ordenamiento de grupos y modificadores',
);

export const updateExistingMenuCases: UpdateExistingMenuCase[] = enabledDatasets('updateExistingMenu')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'updateExistingMenu');

    return {
      ...caseMetadata,
      scenario: 'updateExistingMenu',
      sourceCaseId: sourceCaseId(dataset, 'updateExistingMenu'),
      country: dataset.country,
      brand: brand.label,
      branch: dataset.branch.code,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.updateExistingMenu.loadType,
      versionMenu: scenarioDefaults.updateExistingMenu.versionMenu,
      filterDescription: `Actualizacion de menu existente ${caseMetadata.id}`,
      menuDescription: `Publicacion de menu actualizado ${caseMetadata.id}`,
      expectedFilterMessage: expectedFilterLoadMessage,
      expectedMenuMessage: expectedMenuLoadMessage,
      expectedMenuEmailSubject: expectedMenuLoadEmailSubject,
      expectedMenuEmailBodyFields: menuLoadEmailBodyFields(
        brand.label,
        displayAggregator(dataset.aggregator),
        dataset.branch.code,
      ),
      expectedFilterEmailSubject: expectedFilterLoadEmailSubject,
      expectedFilterEmailBodyFields: filterEmailBodyFields(dataset, brand.label),
    };
  });

export const preserveOrderCases: PreserveOrderCase[] = enabledDatasets('preserveOrder')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'preserveOrder');

    return {
      ...caseMetadata,
      scenario: 'preserveOrder',
      sourceCaseId: sourceCaseId(dataset, 'preserveOrder'),
      country: dataset.country,
      brand: brand.label,
      branch: dataset.branch.code,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.updateExistingMenu.loadType,
      versionMenu: scenarioDefaults.updateExistingMenu.versionMenu,
      filterDescription: `Recarga sin cambios de orden ${caseMetadata.id}`,
      menuDescription: `Publicacion sin cambios de orden ${caseMetadata.id}`,
      expectedFilterMessage: expectedFilterLoadMessage,
      expectedMenuMessage: expectedMenuLoadMessage,
      expectedMenuEmailSubject: expectedMenuLoadEmailSubject,
      expectedMenuEmailBodyFields: menuLoadEmailBodyFields(
        brand.label,
        displayAggregator(dataset.aggregator),
        dataset.branch.code,
      ),
      expectedFilterEmailSubject: expectedFilterLoadEmailSubject,
      expectedFilterEmailBodyFields: filterEmailBodyFields(dataset, brand.label),
    };
  });

export const multipleGroupsCases: MultipleGroupsCase[] = enabledDatasets('multipleGroups')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'multipleGroups');

    return {
      ...caseMetadata,
      scenario: 'multipleGroups',
      sourceCaseId: sourceCaseId(dataset, 'multipleGroups'),
      country: dataset.country,
      brand: brand.label,
      branch: dataset.branch.code,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.updateExistingMenu.loadType,
      versionMenu: scenarioDefaults.updateExistingMenu.versionMenu,
      filterDescription: `Ordenamiento con multiples grupos ${caseMetadata.id}`,
      menuDescription: `Publicacion con multiples grupos ${caseMetadata.id}`,
      expectedFilterMessage: expectedFilterLoadMessage,
      expectedMenuMessage: expectedMenuLoadMessage,
      expectedMenuEmailSubject: expectedMenuLoadEmailSubject,
      expectedMenuEmailBodyFields: menuLoadEmailBodyFields(
        brand.label,
        displayAggregator(dataset.aggregator),
        dataset.branch.code,
      ),
      expectedFilterEmailSubject: expectedFilterLoadEmailSubject,
      expectedFilterEmailBodyFields: filterEmailBodyFields(dataset, brand.label),
    };
  });

function enabledDatasets(scenario: ScenarioId): TestDataset[] {
  return testDatasets.filter(dataset => isScenarioEnabled(dataset, scenario));
}

function metadata(dataset: TestDataset, scenario: ScenarioId): CaseMetadata {
  const brand = getBrand(dataset.brandId);
  const definition = scenarioDefinitions[scenario];
  const cp = resolveCaseId(dataset, scenario);

  return {
    cp,
    id: cp,
    scenario,
    datasetId: dataset.id,
    title: `${definition.title} - ${brand.displayName}`,
    requirement,
    sourceSheet: brand.sourceSheet,
    sourceRow: definition.number + 1,
    brandTag: brand.tag,
  };
}

function sourceCaseId(dataset: TestDataset, scenario: ScenarioId): CaseId {
  return resolveExcelSourceCaseId(dataset, scenario);
}

function buildViewerCase(
  dataset: TestDataset,
  scenario: 'validateVisor',
): CoreViewerCase;
function buildViewerCase(
  dataset: TestDataset,
  scenario: 'validateJson',
): JsonValidationCase;
function buildViewerCase(
  dataset: TestDataset,
  scenario: 'validateVisor' | 'validateJson',
): CoreViewerCase | JsonValidationCase {
  const brand = getBrand(dataset.brandId);
  return {
    ...metadata(dataset, scenario),
    scenario,
    sourceCaseId: sourceCaseId(dataset, scenario),
    country: dataset.country,
    brand: brand.label,
    branch: dataset.branch.code,
    aggregator: displayAggregator(dataset.aggregator),
    menuType: dataset.menuType,
  };
}

type ReorderScenario =
  | 'reorderGroups'
  | 'reorderModifiers'
  | 'reorderGroupsAndModifiers';

type ReorderCaseByScenario<S extends ReorderScenario> = ReorderCaseBase & { scenario: S };

function buildReorderCases<S extends ReorderScenario>(
  scenario: S,
  description: string,
): ReorderCaseByScenario<S>[] {
  return enabledDatasets(scenario).map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, scenario);

    return {
      ...caseMetadata,
      scenario,
      sourceCaseId: sourceCaseId(dataset, scenario),
      country: dataset.country,
      brand: brand.label,
      branch: dataset.branch.code,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.uploadFilters.loadType,
      versionMenu: scenarioDefaults.uploadFilters.versionMenu,
      filterDescription: `${description} ${caseMetadata.id}`,
      menuDescription: `${scenarioDefaults.uploadMenu.descriptionPrefix} ${caseMetadata.id}`,
      expectedFilterMessage: expectedFilterLoadMessage,
      expectedMenuMessage: expectedMenuLoadMessage,
      expectedMenuEmailSubject: expectedMenuLoadEmailSubject,
      expectedMenuEmailBodyFields: menuLoadEmailBodyFields(
        brand.label,
        displayAggregator(dataset.aggregator),
        dataset.branch.code,
      ),
      ...reorderFilterEmailExpectations(dataset, brand.label),
    };
  });
}

function uploadFilterEmailExpectations(
  dataset: TestDataset,
  brand: string,
): Pick<FilterLoadCase, 'expectedEmailSubject' | 'expectedEmailBodyFields'> {
  if (!dataset.overrides?.uploadFilters?.validateEmail) return {};
  return {
    expectedEmailSubject: expectedFilterLoadEmailSubject,
    expectedEmailBodyFields: filterEmailBodyFields(dataset, brand),
  };
}

function reorderFilterEmailExpectations(
  dataset: TestDataset,
  brand: string,
): Pick<ReorderCaseBase, 'expectedFilterEmailSubject' | 'expectedFilterEmailBodyFields'> {
  if (!dataset.overrides?.uploadFilters?.validateEmail) return {};
  return {
    expectedFilterEmailSubject: expectedFilterLoadEmailSubject,
    expectedFilterEmailBodyFields: filterEmailBodyFields(dataset, brand),
  };
}

function filterEmailBodyFields(
  dataset: TestDataset,
  brand: string,
): EmailBodyExpectation[] {
  return [
    { label: 'Pais', values: dataset.country },
    { label: 'Marca', values: brand },
    { label: 'Tipo menu', values: dataset.menuType },
    { label: 'Items', values: 'Items' },
    { label: 'GrupoModificadores', values: 'GrupoModificadores' },
    { label: 'Modificadores', values: 'Modificadores' },
  ];
}

function menuLoadEmailBodyFields(
  brand: string,
  aggregator: string,
  branchCode: string,
): EmailBodyExpectation[] {
  return [
    { label: 'Marca', values: brand, extractPattern: /Marca\s*=\s*([^,\r\n]+)/i },
    { label: 'Agregador', values: aggregator, extractPattern: /Agregador\s*=\s*([^,\r\n]+)/i },
    { label: 'Pais', values: 'MX', extractPattern: /Pa[ií]s\s*=\s*([A-Z]{2})\b/i },
    { label: 'Sucursal', values: branchCode, extractPattern: /SUCURSAL\s*:\s*(\d+)\b/i },
    { label: 'ITEMS', values: 'ITEMS' },
    { label: 'GRUPOS_MODIFICADORES', values: 'GRUPOS_MODIFICADORES' },
    { label: 'MODIFICADORES', values: 'MODIFICADORES' },
  ];
}

function displayAggregator(aggregator: string): string {
  return aggregator === 'RAPPI' ? 'Rappi' : aggregator;
}
