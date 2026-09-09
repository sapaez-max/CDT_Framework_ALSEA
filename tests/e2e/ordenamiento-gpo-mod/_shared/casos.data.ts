import type { MenuLoadFormData, TemplateDownloadFormData } from '@pages/menu/MenuAdministrationPage';

export type TemplateDownloadCase = TemplateDownloadFormData & {
  id: 'CP1' | 'CP13' | 'CP25' | 'CP37';
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  selectDate: boolean;
};

export type MenuLoadCase = MenuLoadFormData & {
  id: 'CP4' | 'CP16' | 'CP28' | 'CP40';
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  childBranchTrace?: string | string[];
};

const expectedTemplateRequestMessage = /confirmaci[oó]n|correo|enviad[ao]|plantilla|[eé]xito|correctamente/i;
const expectedMenuLoadMessage = /El men[uú]\s+se est[aá]\s+cargando correctamente\.?/i;

export const cp1Data: TemplateDownloadCase = {
  id: 'CP1',
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
  title: 'Descarga de plantilla para registro de filtros - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: ['BURGER KING'],
  baseBranch: ['7097'],
  menuType: 'Delivery',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp25Data: TemplateDownloadCase = {
  id: 'CP25',
  title: 'Descarga de plantilla para registro de filtros - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: 'VIPS',
  baseBranch: ['81284',],
  menuType: 'Delivery',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp37Data: TemplateDownloadCase = {
  id: 'CP37',
  title: "Descarga de plantilla para registro de filtros - Chili's",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 2,
  country: ['MEXICO'],
  brand: "CHILIS",
  baseBranch: ['1075'],
  menuType: 'Delivery Codisys',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp4Data: MenuLoadCase = {
  id: 'CP4',
  title: 'Carga exitosa de un nuevo menú para Starbucks en el agregador seleccionado',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: 'STARBUCKS',
  branch: '38109',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi', 'MOP'],
  menuType: 'Delivery BIS',
  description: 'Carga de nuevo menú CP4',
  expectedMessage: expectedMenuLoadMessage,
};

export const cp16Data: MenuLoadCase = {
  id: 'CP16',
  title: 'Carga exitosa de un nuevo menú para Burger King en el agregador seleccionado',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: ['BURGER KING'],
  branch: '7097',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi'],
  menuType: 'Delivery',
  description: 'Carga de nuevo menú CP16',
  expectedMessage: expectedMenuLoadMessage,
};

export const cp28Data: MenuLoadCase = {
  id: 'CP28',
  title: 'Carga exitosa de un nuevo menú para Vips en Uber Eats',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: 'VIPS',
  branch: '81284',
  aggregator: 'UBER EATS',
  menuType: 'Delivery',
  description: 'Carga de nuevo menú CP28',
  expectedMessage: expectedMenuLoadMessage,
};

export const cp40Data: MenuLoadCase = {
  id: 'CP40',
  title: "Carga exitosa de un nuevo menú para Chili's en el agregador seleccionado",
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'Chilis',
  sourceRow: 5,
  country: ['MEXICO'],
  brand: "CHILIS",
  branch: ['1075'],
  menuType: 'Delivery Codisys',
  aggregator: ['UBER EATS', 'DiDi', 'Rappi', 'Alsea'],
  description: 'Carga de nuevo menú CP40',
  expectedMessage: expectedMenuLoadMessage,
};
