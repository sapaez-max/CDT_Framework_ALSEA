import type { BrandCatalogEntry, BrandId } from './types';

export const brandCatalog: Record<BrandId, BrandCatalogEntry> = {
  starbucks: {
    id: 'starbucks',
    country: 'MEXICO',
    name: 'STARBUCKS',
    displayName: 'Starbucks',
    tag: '@starbucks',
    sourceSheet: 'SBX',
    branches: [{
      code: '38109',
      name: 'STARBUCKS WTC',
      selectionLabel: 'STARBUCKS WTC - 38109',
    }],
    aggregators: ['RAPPI'],
    menuTypes: ['Delivery BIS'],
  },
  'burger-king': {
    id: 'burger-king',
    country: 'MEXICO',
    name: 'BURGER KING',
    displayName: 'Burger King',
    tag: '@burger-king',
    sourceSheet: 'BK',
    branches: [{
      code: '12513',
      name: 'Burger King - Aguilas',
      selectionLabel: 'Burger King - Aguilas - 12513',
    }],
    aggregators: ['UBER EATS', 'DIDI', 'RAPPI'],
    menuTypes: ['Delivery'],
  },
  vips: {
    id: 'vips',
    country: 'MEXICO',
    name: 'VIPS',
    displayName: 'VIPS',
    tag: '@vips',
    sourceSheet: 'VIPS',
    branches: [{
      code: '81099',
      name: 'Vips - Las torres',
      selectionLabel: 'Vips - Las torres 81099',
    }],
    aggregators: ['UBER EATS', 'DIDI', 'RAPPI', 'ALSEA'],
    menuTypes: ['Delivery'],
  },
  chilis: {
    id: 'chilis',
    country: 'MEXICO',
    name: 'CHILIS',
    displayName: "Chili's",
    tag: '@chilis',
    sourceSheet: 'Chilis',
    branches: [{
      code: '1075',
      name: 'CHILIS AEROPUERTO T1',
      selectionLabel: 'CHILIS AEROPUERTO T1 - 1075',
    }],
    aggregators: ['UBER EATS', 'DIDI', 'RAPPI', 'ALSEA'],
    menuTypes: ['Delivery Codisys'],
  },
};

export function getBrand(brandId: BrandId): BrandCatalogEntry {
  return brandCatalog[brandId];
}
