import type { FilterLoadFormData, MenuLoadFormData, TemplateDownloadFormData } from '@pages/menu/MenuAdministrationPage';
import type { EmailBodyExpectation } from '@src/integrations/google/gmail-client';

export type BrandTag = '@starbucks' | '@burger-king' | '@vips' | '@chilis';

export type TemplateDownloadCase = TemplateDownloadFormData & {
  id: 'CP1' | 'CP13' | 'CP25' | 'CP37';
  brandTag: BrandTag;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  selectDate: boolean;
};

export type TemplateEditCase = {
  id: 'CP2' | 'CP14' | 'CP26' | 'CP38';
  sourceCaseId: TemplateDownloadCase['id'];
  brandTag: BrandTag;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
};

export type FilterLoadCase = FilterLoadFormData & {
  id: 'CP3' | 'CP15' | 'CP27' | 'CP39';
  sourceCaseId: TemplateEditCase['id'];
  brandTag: BrandTag;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  expectedEmailSubject?: string | RegExp;
  expectedEmailBodyFields?: EmailBodyExpectation[];
};

export type MenuLoadCase = MenuLoadFormData & {
  id: 'CP4' | 'CP16' | 'CP28' | 'CP40';
  sourceCaseId: FilterLoadCase['id'];
  brandTag: BrandTag;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  childBranchTrace?: string | string[];
  expectedEmailSubject: string | RegExp;
  expectedEmailBodyFields: EmailBodyExpectation[];
};

export type CoreViewerCase = {
  id: 'CP5' | 'CP17' | 'CP29' | 'CP41';
  sourceCaseId: MenuLoadCase['id'];
  brandTag: BrandTag;
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  aggregator: string | string[];
  menuType: string | string[];
};

const expectedTemplateRequestMessage = /confirmaci[oó]n|correo|enviad[ao]|plantilla|[eé]xito|correctamente/i;
const expectedFilterLoadMessage = /filtros|correo|enviad[ao]|cargad[ao]|[eé]xito|correctamente/i;
const expectedMenuLoadMessage = /El men[uú]\s+se est[aá]\s+cargando correctamente\.?/i;
const expectedFilterLoadEmailSubject = /carga\s+de\s+la\s+plantilla\s+desarrollo/i;
const expectedMenuLoadEmailSubject = 'Carga de menu - Desarrollo';

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

export const cp1Data: TemplateDownloadCase = {
  id: 'CP1',
  brandTag: '@starbucks',
  title: 'Descarga de plantilla para registro de filtros - Starbucks',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: 'STARBUCKS',
  baseBranch: ['38109'],
  menuType: 'Delivery BIS',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp13Data: TemplateDownloadCase = {
  id: 'CP13',
  brandTag: '@burger-king',
  title: 'Descarga de plantilla para registro de filtros - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 2,
  country: 'MEXICO',
  brand: 'BURGER KING',
  baseBranch: '7097',
  expectedBaseBranchLabel: 'Burger King - Minerva - 7097',
  menuType: 'Delivery',
  selectDate: true,
  downloadDate: '03/08/2026',
  exactSelections: true,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp25Data: TemplateDownloadCase = {
  id: 'CP25',
  brandTag: '@vips',
  title: 'Descarga de plantilla para registro de filtros - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: 'VIPS',
  baseBranch: ['81284'],
  menuType: 'Delivery',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp37Data: TemplateDownloadCase = {
  id: 'CP37',
  brandTag: '@chilis',
  title: "Descarga de plantilla para registro de filtros - Chili's",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: 'CHILIS',
  baseBranch: ['1075'],
  menuType: 'Delivery Codisys',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp2Data: TemplateEditCase = {
  id: 'CP2',
  sourceCaseId: 'CP1',
  brandTag: '@starbucks',
  title: 'Edicion de plantilla de grupos modificadores y modificadores - Starbucks',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 3,
};

export const cp14Data: TemplateEditCase = {
  id: 'CP14',
  sourceCaseId: 'CP13',
  brandTag: '@burger-king',
  title: 'Edicion de plantilla de grupos modificadores y modificadores - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 3,
};

export const cp26Data: TemplateEditCase = {
  id: 'CP26',
  sourceCaseId: 'CP25',
  brandTag: '@vips',
  title: 'Edicion de plantilla de grupos modificadores y modificadores - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 3,
};

export const cp38Data: TemplateEditCase = {
  id: 'CP38',
  sourceCaseId: 'CP37',
  brandTag: '@chilis',
  title: "Edicion de plantilla de grupos modificadores y modificadores - Chili's",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 3,
};

export const cp3Data: FilterLoadCase = {
  id: 'CP3',
  sourceCaseId: 'CP2',
  brandTag: '@starbucks',
  title: 'Cargar filtros para un nuevo menu - Starbucks',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 4,
  country: ['MEXICO'],
  brand: 'STARBUCKS',
  aggregator: ['Rappi'],
  baseBranch: ['STARBUCKS WTC - 38109'],
  menuType: 'Delivery',
  childBranch: ['38119'],
  childMenuType: 'Delivery BIS',
  loadType: 'Nuevo menú',
  versionMenu: 'No',
  description: 'Carga de filtros CP3',
  expectedMessage: expectedFilterLoadMessage,
  expectedEmailSubject: expectedFilterLoadEmailSubject,
  expectedEmailBodyFields: [
    { label: 'Pais', values: ['MEXICO'] },
    { label: 'Marca', values: 'STARBUCKS' },
    { label: 'Tipo menu', values: 'Delivery BIS' },
    { label: 'Items', values: 'Items' },
    { label: 'GrupoModificadores', values: 'GrupoModificadores' },
    { label: 'Modificadores', values: 'Modificadores' },
  ],
};

export const cp15Data: FilterLoadCase = {
  id: 'CP15',
  sourceCaseId: 'CP14',
  brandTag: '@burger-king',
  title: 'Cargar filtros para un nuevo menu - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 4,
  country: ['MEXICO'],
  brand: ['BURGER KING'],
  branch: '7097',
  aggregator: ['UBER EATS'],
  menuType: 'Delivery',
  loadType: 'Nuevo menu',
  versionMenu: 'No',
  description: 'Carga de filtros CP15',
  expectedMessage: expectedFilterLoadMessage,
};

export const cp27Data: FilterLoadCase = {
  id: 'CP27',
  sourceCaseId: 'CP26',
  brandTag: '@vips',
  title: 'Cargar filtros para un nuevo menu - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 4,
  country: ['MEXICO'],
  brand: 'VIPS',
  baseBranch: ['81143'],
  menuType: 'Delivery',
  childBranch: ['81307'],
  childMenuType: 'Delivery Codisys',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi', 'Alsea'],
  loadType: 'Nuevo menu',
  versionMenu: 'No',
  description: 'Carga de filtros CP27',
  expectedMessage: expectedFilterLoadMessage,
};

export const cp39Data: FilterLoadCase = {
  id: 'CP39',
  sourceCaseId: 'CP38',
  brandTag: '@chilis',
  title: "Cargar filtros para un nuevo menu - Chili's",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 4,
  country: ['MEXICO'],
  brand: 'CHILIS',
  baseBranch: ['1075'],
  childBranch: ['1002'],
  aggregator: ['UBER EATS', 'DiDi', 'Rappi', 'Alsea'],
  menuType: 'Delivery Codisys',
  loadType: 'Nuevo menu',
  versionMenu: 'No',
  description: 'Carga de filtros CP39',
  expectedMessage: expectedFilterLoadMessage,
};

export const cp4Data: MenuLoadCase = {
  id: 'CP4',
  sourceCaseId: 'CP3',
  brandTag: '@starbucks',
  title: 'Carga exitosa de un nuevo menu para Starbucks en el agregador seleccionado',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: 'STARBUCKS',
  branch: 'STARBUCKS WTC - 38109',
  aggregator: ['Rappi'],
  menuType: 'Delivery BIS',
  description: 'Carga de nuevo menu CP4',
  expectedMessage: expectedMenuLoadMessage,
  expectedEmailSubject: expectedMenuLoadEmailSubject,
  expectedEmailBodyFields: menuLoadEmailBodyFields('STARBUCKS', 'Rappi', '38109'),
};

export const cp16Data: MenuLoadCase = {
  id: 'CP16',
  sourceCaseId: 'CP15',
  brandTag: '@burger-king',
  title: 'Carga exitosa de un nuevo menu para Burger King en el agregador seleccionado',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: ['BURGER KING'],
  branch: '7097',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi'],
  menuType: 'Delivery',
  description: 'Carga de nuevo menu CP16',
  expectedMessage: expectedMenuLoadMessage,
  expectedEmailSubject: expectedMenuLoadEmailSubject,
  expectedEmailBodyFields: menuLoadEmailBodyFields('BURGER KING', 'UBER EATS', '7097'),
};

export const cp28Data: MenuLoadCase = {
  id: 'CP28',
  sourceCaseId: 'CP27',
  brandTag: '@vips',
  title: 'Carga exitosa de un nuevo menu para Vips en Uber Eats',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: 'VIPS',
  branch: '81284',
  aggregator: 'UBER EATS',
  menuType: 'Delivery',
  description: 'Carga de nuevo menu CP28',
  expectedMessage: expectedMenuLoadMessage,
  expectedEmailSubject: expectedMenuLoadEmailSubject,
  expectedEmailBodyFields: menuLoadEmailBodyFields('VIPS', 'UBER EATS', '81284'),
};

export const cp40Data: MenuLoadCase = {
  id: 'CP40',
  sourceCaseId: 'CP39',
  brandTag: '@chilis',
  title: "Carga exitosa de un nuevo menu para Chili's en el agregador seleccionado",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: 'CHILIS',
  branch: ['1075'],
  menuType: 'Delivery Codisys',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi', 'Alsea'],
  description: 'Carga de nuevo menu CP40',
  expectedMessage: expectedMenuLoadMessage,
  expectedEmailSubject: expectedMenuLoadEmailSubject,
  expectedEmailBodyFields: menuLoadEmailBodyFields('CHILIS', 'UBER EATS', '1075'),
};

export const cp5Data: CoreViewerCase = {
  id: 'CP5',
  sourceCaseId: 'CP4',
  brandTag: '@starbucks',
  title: 'Validacion de orden de grupos modificadores y modificadores en Visor CORE - Starbucks',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 6,
  country: ['MEXICO'],
  brand: 'STARBUCKS',
  branch: 'STARBUCKS WTC - 38109',
  aggregator: 'Rappi',
  menuType: 'Delivery BIS',
};

export const cp17Data: CoreViewerCase = {
  id: 'CP17',
  sourceCaseId: 'CP16',
  brandTag: '@burger-king',
  title: 'Validacion de orden de grupos modificadores y modificadores en Visor CORE - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 6,
  country: ['MEXICO'],
  brand: ['BURGER KING'],
  branch: '7097',
  aggregator: ['UBER EATS', 'DIDI', 'RAPPI'],
  menuType: 'Delivery',
};

export const cp29Data: CoreViewerCase = {
  id: 'CP29',
  sourceCaseId: 'CP28',
  brandTag: '@vips',
  title: 'Validacion de orden de grupos modificadores y modificadores en Visor CORE - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 6,
  country: ['MEXICO'],
  brand: 'VIPS',
  branch: '7097',
  aggregator: 'UBER EATS',
  menuType: 'Delivery',
};

export const cp41Data: CoreViewerCase = {
  id: 'CP41',
  sourceCaseId: 'CP40',
  brandTag: '@chilis',
  title: "Validacion de orden de grupos modificadores y modificadores en Visor CORE - Chili's",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 6,
  country: ['MEXICO'],
  brand: 'CHILIS',
  branch: ['1002', '1075'],
  aggregator: ['UBER EATS', 'DIDI', 'RAPPI', 'Alsea'],
  menuType: 'Delivery Codisys',
};
