import type { BrandId } from './types';

type ScenarioOverrides = {
  downloadTemplate?: {
    selectDate?: boolean;
    downloadDate?: string;
    exactSelections?: boolean;
    expectedBaseBranchLabel?: string;
  };
};

export const scenarioData: Record<BrandId, ScenarioOverrides> = {
  starbucks: {},
  'burger-king': {
    downloadTemplate: {
      selectDate: true,
      downloadDate: '03/08/2026',
      exactSelections: true,
      expectedBaseBranchLabel: 'Burger King - Aguilas - 12513',
    },
  },
  vips: {},
  chilis: {},
};
