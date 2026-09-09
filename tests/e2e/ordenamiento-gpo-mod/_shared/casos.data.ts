import type { TemplateDownloadFormData } from '@pages/menu/MenuAdministrationPage';

export type TemplateDownloadCase = TemplateDownloadFormData & {
  id: 'CP1' | 'CP13' | 'CP25' | 'CP37';
  title: string;
  requirement: string;
  sourceSheet: string;
  sourceRow: number;
  selectDate: boolean;
};

const expectedTemplateRequestMessage = /confirmaci[oó]n|correo|enviad[ao]|plantilla|[eé]xito|correctamente/i;

export const cp1Data: TemplateDownloadCase = {
  id: 'CP1',
  title: 'Descarga de plantilla para registro de filtros - Starbucks',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'SBX',
  sourceRow: 2,
  country: ['México', 'Mexico'],
  brand: 'Starbucks',
  baseBranch: ['38109 (WTC)', '38109'],
  childBranch: ['38119 (Lomas Verdes)', '38119'],
  menuType: 'Delivery BIS',
  childMenuType: 'Delivery BIS',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp13Data: TemplateDownloadCase = {
  id: 'CP13',
  title: 'Descarga de plantilla para registro de filtros - Burger King',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'BK',
  sourceRow: 2,
  country: ['México', 'Mexico'],
  brand: ['Burguer King', 'Burger King'],
  baseBranch: ['7097 (Minerva)', '7097'],
  childBranch: ['22780 (Portal San Angel)', '22780'],
  menuType: 'Delivery',
  childMenuType: 'Delivery',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};

export const cp25Data: TemplateDownloadCase = {
  id: 'CP25',
  title: 'Descarga de plantilla para registro de filtros - VIPS',
  requirement: 'OrdenamientoGpoMod&Mod 2.0',
  sourceSheet: 'VIPS',
  sourceRow: 2,
  country: ['México', 'Mexico'],
  brand: 'Vips',
  baseBranch: ['7097', '7097 (Minerva)'],
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
  country: ['México', 'Mexico'],
  brand: "Chilis",
  baseBranch: ['1075 (Aeropuerto T1)', '1075'],
  childBranch: ['1002 (Universidad)', '1002'],
  menuType: 'Delivery Codisys',
  selectDate: false,
  expectedMessage: expectedTemplateRequestMessage,
};
