import type { EmailBodyExpectation } from '@src/integrations/google/gmail-client';
import { getBrand } from './catalog.data';
import { getCaseMapping, getPreviousCaseId } from './case-mapping.data';
import { isScenarioEnabled, testDatasets } from './datasets.data';
import { scenarioData } from './scenario-data';
import { scenarioDefaults } from './scenario-defaults';
import type {
  CaseMetadata,
  CoreViewerCase,
  FilterLoadCase,
  MenuLoadCase,
  ScenarioId,
  TemplateDownloadCase,
  TemplateEditCase,
  TestDataset,
} from './types';

const expectedTemplateRequestMessage = /confirmaci[oó]n|correo|enviad[ao]|plantilla|[eé]xito|correctamente/i;
const expectedFilterLoadMessage = /filtros|correo|enviad[ao]|cargad[ao]|[eé]xito|correctamente/i;
const expectedMenuLoadMessage = /El men[uú]\s+se est[aá]\s+cargando correctamente\.?/i;
const expectedFilterLoadEmailSubject = /carga\s+de\s+la\s+plantilla\s+desarrollo/i;
const expectedMenuLoadEmailSubject = 'Carga de menu - Desarrollo';

export const downloadTemplateCases: TemplateDownloadCase[] = enabledDatasets('downloadTemplate')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const override = scenarioData[dataset.brandId].downloadTemplate;

    return {
      ...metadata(dataset, 'downloadTemplate'),
      scenario: 'downloadTemplate',
      country: dataset.country,
      brand: brand.name,
      baseBranch: dataset.branchCode,
      menuType: dataset.menuType,
      selectDate: override?.selectDate ?? scenarioDefaults.downloadTemplate.selectDate,
      downloadDate: override?.downloadDate,
      exactSelections: override?.exactSelections,
      expectedBaseBranchLabel: override?.expectedBaseBranchLabel,
      expectedMessage: expectedTemplateRequestMessage,
    };
  });

export const editTemplateCases: TemplateEditCase[] = enabledDatasets('editTemplate')
  .map(dataset => ({
    ...metadata(dataset, 'editTemplate'),
    scenario: 'editTemplate',
    sourceCaseId: getPreviousCaseId(dataset.id, 'editTemplate'),
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
      sourceCaseId: getPreviousCaseId(dataset.id, 'uploadFilters'),
      country: dataset.country,
      brand: brand.name,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
      loadType: scenarioDefaults.uploadFilters.loadType,
      versionMenu: scenarioDefaults.uploadFilters.versionMenu,
      description: `Carga de filtros ${caseMetadata.id}`,
      expectedMessage: expectedFilterLoadMessage,
      ...(dataset.brandId === 'starbucks' ? {
        expectedEmailSubject: expectedFilterLoadEmailSubject,
        expectedEmailBodyFields: [
          { label: 'Pais', values: dataset.country },
          { label: 'Marca', values: brand.name },
          { label: 'Tipo menu', values: dataset.menuType },
          { label: 'Items', values: 'Items' },
          { label: 'GrupoModificadores', values: 'GrupoModificadores' },
          { label: 'Modificadores', values: 'Modificadores' },
        ],
      } : {}),
    };
  });

export const uploadMenuCases: MenuLoadCase[] = enabledDatasets('uploadMenu')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);
    const caseMetadata = metadata(dataset, 'uploadMenu');
    const branch = brand.branches.find(candidate => candidate.code === dataset.branchCode);
    const branchSelection = branch?.selectionLabel
      ?? (branch?.name ? `${branch.name} - ${branch.code}` : dataset.branchCode);

    return {
      ...caseMetadata,
      scenario: 'uploadMenu',
      sourceCaseId: getPreviousCaseId(dataset.id, 'uploadMenu'),
      country: dataset.country,
      brand: brand.name,
      branch: branchSelection,
      aggregator: dataset.aggregator,
      menuType: dataset.menuType,
      description: `${scenarioDefaults.uploadMenu.descriptionPrefix} ${caseMetadata.id}`,
      expectedMessage: expectedMenuLoadMessage,
      expectedEmailSubject: expectedMenuLoadEmailSubject,
      expectedEmailBodyFields: menuLoadEmailBodyFields(
        brand.name,
        displayAggregator(dataset.aggregator),
        dataset.branchCode,
      ),
    };
  });

export const validateVisorCases: CoreViewerCase[] = enabledDatasets('validateVisor')
  .map(dataset => {
    const brand = getBrand(dataset.brandId);

    return {
      ...metadata(dataset, 'validateVisor'),
      scenario: 'validateVisor',
      sourceCaseId: getPreviousCaseId(dataset.id, 'validateVisor'),
      country: dataset.country,
      brand: brand.name,
      branch: dataset.branchCode,
      aggregator: displayAggregator(dataset.aggregator),
      menuType: dataset.menuType,
    };
  });

function enabledDatasets(scenario: ScenarioId): TestDataset[] {
  return testDatasets.filter(dataset => isScenarioEnabled(dataset, scenario));
}

function metadata(dataset: TestDataset, scenario: ScenarioId): CaseMetadata {
  const mapping = getCaseMapping(dataset.id, scenario);
  return {
    ...mapping,
    id: mapping.cp,
    brandTag: getBrand(dataset.brandId).tag,
  };
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
