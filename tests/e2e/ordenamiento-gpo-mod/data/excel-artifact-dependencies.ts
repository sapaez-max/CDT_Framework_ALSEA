import {
  resolveCaseId,
  type CaseId,
  type ScenarioId,
  type TestDataset,
} from './datasets.data';

export type ExcelArtifactMode = 'create' | 'reference';

export type ExcelArtifactDependency = {
  mode: ExcelArtifactMode;
  sourceScenario?: ScenarioId;
};

export const excelArtifactDependencies = {
  downloadTemplate: {
    mode: 'create',
  },
  editTemplate: {
    mode: 'create',
    sourceScenario: 'downloadTemplate',
  },
  uploadFilters: {
    mode: 'reference',
    sourceScenario: 'editTemplate',
  },
  uploadMenu: {
    mode: 'reference',
    sourceScenario: 'editTemplate',
  },
  validateVisor: {
    mode: 'reference',
    sourceScenario: 'editTemplate',
  },
  validateJson: {
    mode: 'reference',
    sourceScenario: 'editTemplate',
  },
  reorderGroups: {
    mode: 'create',
    sourceScenario: 'downloadTemplate',
  },
  reorderModifiers: {
    mode: 'create',
    sourceScenario: 'downloadTemplate',
  },
  reorderGroupsAndModifiers: {
    mode: 'create',
    sourceScenario: 'downloadTemplate',
  },
  updateExistingMenu: {
    mode: 'create',
    sourceScenario: 'reorderGroupsAndModifiers',
  },
  preserveOrder: {
    mode: 'create',
    sourceScenario: 'updateExistingMenu',
  },
  multipleGroups: {
    mode: 'create',
    sourceScenario: 'preserveOrder',
  },
} as const satisfies Record<ScenarioId, ExcelArtifactDependency>;

export function resolveExcelSourceScenario(scenario: ScenarioId): ScenarioId {
  const dependency = excelArtifactDependencies[scenario];
  const sourceScenario = 'sourceScenario' in dependency ? dependency.sourceScenario : undefined;
  if (!sourceScenario) throw new Error(`${scenario} no tiene un escenario de origen Excel.`);
  return sourceScenario;
}

export function resolveExcelSourceCaseId(dataset: TestDataset, scenario: ScenarioId): CaseId {
  return resolveCaseId(dataset, resolveExcelSourceScenario(scenario));
}
