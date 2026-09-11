import type {
  FilterLoadFormData,
  MenuLoadFormData,
  TemplateDownloadFormData,
} from '@pages/menu/MenuAdministrationPage';
import type { EmailBodyExpectation } from '@src/integrations/google/gmail-client';

export const scenarioIds = [
  'downloadTemplate',
  'editTemplate',
  'uploadFilters',
  'uploadMenu',
  'validateVisor',
  'validateJson',
  'reorderGroups',
  'reorderModifiers',
  'reorderGroupsAndModifiers',
  'updateExistingMenu',
  'preserveOrder',
  'multipleGroups',
] as const;

export type ScenarioId = typeof scenarioIds[number];
export type BrandId = 'starbucks' | 'burger-king' | 'vips' | 'chilis';
export type BrandTag = '@starbucks' | '@burger-king' | '@vips' | '@chilis';
export type CaseId = `CP${number}`;

export type Branch = {
  code: string;
  name?: string;
  selectionLabel?: string;
};

export type BrandCatalogEntry = {
  id: BrandId;
  country: string;
  name: string;
  displayName: string;
  tag: BrandTag;
  sourceSheet: string;
  branches: Branch[];
  aggregators: string[];
  menuTypes: string[];
};

export type ScenarioApplicability = Partial<Record<ScenarioId, boolean>>;

export type TestDataset = {
  id: string;
  enabled: boolean;
  primary: boolean;
  brandId: BrandId;
  country: string;
  branchCode: string;
  aggregator: string;
  menuType: string;
  runAllScenarios?: boolean;
  scenarios?: ScenarioApplicability;
};

export type CaseMapping = {
  cp: CaseId;
  scenario: ScenarioId;
  datasetId: string;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
};

export type CaseMetadata = CaseMapping & {
  id: CaseId;
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
  selectionStrategy: 'first-eligible-group';
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

export type ReorderGroupsCase = CaseMetadata & {
  scenario: 'reorderGroups';
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

export type ReorderModifiersCase = Omit<ReorderGroupsCase, 'scenario'> & {
  scenario: 'reorderModifiers';
};

export type ReorderGroupsAndModifiersCase = Omit<ReorderGroupsCase, 'scenario'> & {
  scenario: 'reorderGroupsAndModifiers';
};
