import { brandCatalog } from './catalog.data';
import { scenarioIds, type ScenarioId, type TestDataset } from './types';

export const testDatasets: TestDataset[] = [
  {
    id: 'starbucks-wtc-rappi',
    enabled: true,
    primary: true,
    brandId: 'starbucks',
    country: 'MEXICO',
    branchCode: '38109',
    aggregator: 'RAPPI',
    menuType: 'Delivery BIS',
    scenarios: currentScenarioApplicability(),
  },
  {
    id: 'burgerking-aguilas-uber',
    enabled: true,
    primary: true,
    brandId: 'burger-king',
    country: 'MEXICO',
    branchCode: '12513',
    aggregator: 'UBER EATS',
    menuType: 'Delivery',
    scenarios: currentScenarioApplicability(),
  },
  {
    id: 'vips-las-torres-uber',
    enabled: true,
    primary: true,
    brandId: 'vips',
    country: 'MEXICO',
    branchCode: '81099',
    aggregator: 'UBER EATS',
    menuType: 'Delivery',
    scenarios: currentScenarioApplicability(),
  },
  {
    id: 'chilis-aeropuerto-t1-uber',
    enabled: true,
    primary: true,
    brandId: 'chilis',
    country: 'MEXICO',
    branchCode: '1075',
    aggregator: 'UBER EATS',
    menuType: 'Delivery Codisys',
    scenarios: currentScenarioApplicability(),
  },
];

function currentScenarioApplicability() {
  return {
    downloadTemplate: true,
    editTemplate: true,
    uploadFilters: true,
    uploadMenu: true,
    validateVisor: true,
  } as const;
}

validateDatasets(testDatasets);

export function getDataset(datasetId: string): TestDataset {
  const dataset = testDatasets.find(candidate => candidate.id === datasetId);
  if (!dataset) throw new Error(`No existe el juego de datos ${datasetId}.`);
  return dataset;
}

export function isScenarioEnabled(dataset: TestDataset, scenario: ScenarioId): boolean {
  return dataset.enabled && (dataset.runAllScenarios === true || dataset.scenarios?.[scenario] === true);
}

function validateDatasets(datasets: TestDataset[]): void {
  const ids = new Set<string>();

  for (const dataset of datasets) {
    if (ids.has(dataset.id)) throw new Error(`El juego de datos ${dataset.id} esta duplicado.`);
    ids.add(dataset.id);

    const brand = brandCatalog[dataset.brandId];
    if (dataset.country !== brand.country) {
      throw new Error(`${dataset.id}: el pais ${dataset.country} no corresponde a ${brand.name}.`);
    }
    if (!brand.branches.some(branch => branch.code === dataset.branchCode)) {
      throw new Error(`${dataset.id}: la sucursal ${dataset.branchCode} no esta registrada para ${brand.name}.`);
    }
    if (!brand.aggregators.includes(dataset.aggregator)) {
      throw new Error(`${dataset.id}: el agregador ${dataset.aggregator} no esta registrado para ${brand.name}.`);
    }
    if (!brand.menuTypes.includes(dataset.menuType)) {
      throw new Error(`${dataset.id}: el tipo de menu ${dataset.menuType} no esta registrado para ${brand.name}.`);
    }
    if (!dataset.runAllScenarios && !scenarioIds.some(scenario => dataset.scenarios?.[scenario])) {
      throw new Error(`${dataset.id}: habilita al menos un escenario o usa runAllScenarios.`);
    }
  }
}
