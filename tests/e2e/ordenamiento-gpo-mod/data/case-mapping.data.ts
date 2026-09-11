import { getBrand } from './catalog.data';
import { testDatasets } from './datasets.data';
import type { CaseId, CaseMapping, ScenarioId } from './types';

const requirement = 'OrdenamientoGpoMod&Mod 2.0';

const scenarioDefinitions: Array<{
  scenario: ScenarioId;
  offset: number;
  title: string;
}> = [
  { scenario: 'downloadTemplate', offset: 0, title: 'Descarga de plantilla para registro de filtros' },
  { scenario: 'editTemplate', offset: 1, title: 'Edicion de plantilla de grupos modificadores y modificadores' },
  { scenario: 'uploadFilters', offset: 2, title: 'Cargar filtros para un nuevo menu' },
  { scenario: 'uploadMenu', offset: 3, title: 'Carga exitosa de un nuevo menu' },
  { scenario: 'validateVisor', offset: 4, title: 'Validacion en Visor CORE' },
  { scenario: 'validateJson', offset: 5, title: 'Validacion del JSON' },
  { scenario: 'reorderGroups', offset: 6, title: 'Ordenamiento de grupos modificadores' },
  { scenario: 'reorderModifiers', offset: 7, title: 'Ordenamiento de modificadores' },
  { scenario: 'reorderGroupsAndModifiers', offset: 8, title: 'Ordenamiento de grupos y modificadores' },
  { scenario: 'updateExistingMenu', offset: 9, title: 'Modificacion de un menu existente' },
  { scenario: 'preserveOrder', offset: 10, title: 'Conservacion del orden configurado' },
  { scenario: 'multipleGroups', offset: 11, title: 'Validacion de multiples grupos modificadores' },
];

const datasetStart: Record<string, number> = {
  'starbucks-wtc-rappi': 1,
  'burgerking-aguilas-uber': 13,
  'vips-las-torres-uber': 25,
  'chilis-aeropuerto-t1-uber': 37,
};

export const caseMapping: CaseMapping[] = testDatasets.flatMap(dataset => {
  const start = datasetStart[dataset.id];
  if (!start) throw new Error(`Falta el numero inicial de CP para ${dataset.id}.`);
  const brand = getBrand(dataset.brandId);

  return scenarioDefinitions.map(({ scenario, offset, title }) => ({
    cp: `CP${start + offset}` as CaseId,
    scenario,
    datasetId: dataset.id,
    title: `${title} - ${brand.displayName}`,
    requirement,
    sourceSheet: brand.sourceSheet,
    sourceRow: offset + 2,
  }));
});

export function getCaseMapping(datasetId: string, scenario: ScenarioId): CaseMapping {
  const mapping = caseMapping.find(candidate =>
    candidate.datasetId === datasetId && candidate.scenario === scenario);
  if (!mapping) throw new Error(`No existe mapeo para ${datasetId}/${scenario}.`);
  return mapping;
}

export function getPreviousCaseId(datasetId: string, scenario: ScenarioId): CaseId {
  const index = scenarioDefinitions.findIndex(candidate => candidate.scenario === scenario);
  if (index <= 0) throw new Error(`${scenario} no tiene un caso anterior.`);
  return getCaseMapping(datasetId, scenarioDefinitions[index - 1].scenario).cp;
}
