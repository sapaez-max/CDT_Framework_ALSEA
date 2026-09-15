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
export type CaseId = `CP${number}`;
export type BrandTag = `@${string}`;

export type BrandProfile = {
  label: string;
  displayName: string;
  tag: BrandTag;
  sourceSheet: string;
  traceability: {
    cpBase: number;
    cpOverrides?: Partial<Record<ScenarioId, CaseId>>;
  };
};

export const brandProfiles = {
  starbucks: {
    label: 'STARBUCKS',
    displayName: 'Starbucks',
    tag: '@starbucks',
    sourceSheet: 'SBX',
    traceability: { cpBase: 1 },
  },
  'burger-king': {
    label: 'BURGER KING',
    displayName: 'Burger King',
    tag: '@burger-king',
    sourceSheet: 'BK',
    traceability: { cpBase: 13 },
  },
  vips: {
    label: 'VIPS',
    displayName: 'VIPS',
    tag: '@vips',
    sourceSheet: 'VIPS',
    traceability: { cpBase: 25 },
  },
  chilis: {
    label: 'CHILIS',
    displayName: "Chili's",
    tag: '@chilis',
    sourceSheet: 'Chilis',
    traceability: { cpBase: 37 },
  },
} as const satisfies Record<string, BrandProfile>;

export type BrandId = keyof typeof brandProfiles;

export type DatasetOverrides = {
  downloadTemplate?: {
    date?: string;
    exactSelections?: boolean;
  };
  uploadFilters?: {
    validateEmail?: boolean;
  };
};

export type TestDataset = {
  id: string;
  enabled: boolean;
  country: string;
  brandId: BrandId;
  branch: {
    code: string;
    name: string;
    label: string;
  };
  aggregator: string;
  menuType: string;
  enabledScenarios: readonly ScenarioId[];
  overrides?: DatasetOverrides;
};

const implementedScenarios = [
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
] as const satisfies readonly ScenarioId[];

const configuredTestDatasets = [
  {
    id: 'starbucks-wtc-uber',
    enabled: true,
    country: 'MEXICO',
    brandId: 'starbucks',
    branch: {
      code: '38109',
      name: 'STARBUCKS WTC',
      label: 'STARBUCKS WTC - 38109',
    },
    aggregator: 'UBER EATS',
    menuType: 'Delivery BIS',
    enabledScenarios: implementedScenarios,
    overrides: {
      uploadFilters: { validateEmail: true },
    },
  },
  {
    id: 'burgerking-aguilas-uber',
    enabled: true,
    country: 'MEXICO',
    brandId: 'burger-king',
    branch: {
      code: '12513',
      name: 'Burger King - Aguilas',
      label: 'Burger King - Aguilas - 12513',
    },
    aggregator: 'UBER EATS',
    menuType: 'Delivery',
    enabledScenarios: implementedScenarios,
    overrides: {
      downloadTemplate: {
        date: '03/08/2026',
        exactSelections: true,
      },
    },
  },
  {
    id: 'vips-las-torres-uber',
    enabled: true,
    country: 'MEXICO',
    brandId: 'vips',
    branch: {
      code: '81099',
      name: 'Vips - Las torres',
      label: 'Vips - Las torres 81099',
    },
    aggregator: 'UBER EATS',
    menuType: 'Delivery',
    enabledScenarios: implementedScenarios,
  },
  {
    id: 'chilis-aeropuerto-t1-uber',
    enabled: true,
    country: 'MEXICO',
    brandId: 'chilis',
    branch: {
      code: '1075',
      name: 'CHILIS AEROPUERTO T1',
      label: 'CHILIS AEROPUERTO T1 - 1075',
    },
    aggregator: 'UBER EATS',
    menuType: 'Delivery Codisys',
    enabledScenarios: implementedScenarios,
  },
] as const satisfies readonly TestDataset[];

export const testDatasets = configuredTestDatasets;

validateDatasets(testDatasets);

export function getDataset(datasetId: string): TestDataset {
  const dataset = testDatasets.find(candidate => candidate.id === datasetId);
  if (!dataset) throw new Error(`No existe el juego de datos ${datasetId}.`);
  return dataset;
}

export function getBrand(brandId: BrandId): BrandProfile {
  const brand = brandProfiles[brandId];
  if (!brand) throw new Error(`No existe la marca ${brandId}.`);
  return brand;
}

export function isScenarioEnabled(dataset: TestDataset, scenario: ScenarioId): boolean {
  return dataset.enabled && dataset.enabledScenarios.includes(scenario);
}

export function resolveCaseId(dataset: TestDataset, scenario: ScenarioId): CaseId {
  const brand = getBrand(dataset.brandId);
  const override = brand.traceability.cpOverrides?.[scenario];
  if (override) return override;
  const scenarioNumber = scenarioIds.indexOf(scenario) + 1;
  if (scenarioNumber <= 0) throw new Error(`No existe el escenario ${scenario}.`);
  return `CP${brand.traceability.cpBase + scenarioNumber - 1}`;
}

export function validateDatasets(datasets: readonly TestDataset[]): void {
  const ids = new Set<string>();
  const combinations = new Set<string>();
  const assignedCases = new Map<CaseId, { brandId: BrandId; scenario: ScenarioId }>();
  validateBrandProfiles();

  for (const [brandId, brand] of Object.entries(brandProfiles)) {
    requireText(brand.label, `${brandId}: label de marca`);
    requireText(brand.displayName, `${brandId}: displayName de marca`);
    requireText(brand.sourceSheet, `${brandId}: sourceSheet de marca`);
    if (!/^@[a-z0-9-]+$/.test(brand.tag)) {
      throw new Error(`${brandId}: el tag ${brand.tag} no tiene un formato valido.`);
    }
  }

  for (const dataset of datasets) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dataset.id)) {
      throw new Error(`${dataset.id}: utiliza un id en kebab-case.`);
    }
    if (ids.has(dataset.id)) throw new Error(`El juego de datos ${dataset.id} esta duplicado.`);
    ids.add(dataset.id);

    if (!brandProfiles[dataset.brandId]) {
      throw new Error(`${dataset.id}: la marca ${dataset.brandId} no esta registrada.`);
    }
    requireText(dataset.country, `${dataset.id}: country`);
    requireText(dataset.branch.code, `${dataset.id}: branch.code`);
    requireText(dataset.branch.name, `${dataset.id}: branch.name`);
    requireText(dataset.branch.label, `${dataset.id}: branch.label`);
    requireText(dataset.aggregator, `${dataset.id}: aggregator`);
    requireText(dataset.menuType, `${dataset.id}: menuType`);

    if (!dataset.branch.label.includes(dataset.branch.code)) {
      throw new Error(`${dataset.id}: branch.label debe contener el codigo ${dataset.branch.code}.`);
    }
    if (dataset.enabledScenarios.length === 0) {
      throw new Error(`${dataset.id}: habilita al menos un escenario.`);
    }

    const uniqueScenarios = new Set<ScenarioId>();
    for (const scenario of dataset.enabledScenarios) {
      if (!scenarioIds.includes(scenario)) {
        throw new Error(`${dataset.id}: el escenario ${scenario} no existe.`);
      }
      if (uniqueScenarios.has(scenario)) {
        throw new Error(`${dataset.id}: el escenario ${scenario} esta duplicado.`);
      }
      uniqueScenarios.add(scenario);
    }

    const combination = [
      dataset.country,
      dataset.brandId,
      dataset.branch.code,
      dataset.aggregator,
      dataset.menuType,
    ].join('|').toLocaleLowerCase();
    if (combinations.has(combination)) {
      throw new Error(`${dataset.id}: la combinacion funcional esta duplicada.`);
    }
    combinations.add(combination);

    for (const scenario of scenarioIds) {
      const cp = resolveCaseId(dataset, scenario);
      if (!/^CP[1-9]\d*$/.test(cp)) {
        throw new Error(`${dataset.id}/${scenario}: el CP ${cp} no es valido.`);
      }
      const owner = assignedCases.get(cp);
      if (owner) {
        if (owner.brandId !== dataset.brandId || owner.scenario !== scenario) {
          throw new Error(
            `${dataset.id}/${scenario}: ${cp} ya pertenece a ${owner.brandId}/${owner.scenario}.`,
          );
        }
      } else {
        assignedCases.set(cp, { brandId: dataset.brandId, scenario });
      }
    }

    validateObjectKeys(
      dataset.overrides,
      ['downloadTemplate', 'uploadFilters'],
      `${dataset.id}: overrides`,
    );
    validateObjectKeys(
      dataset.overrides?.downloadTemplate,
      ['date', 'exactSelections'],
      `${dataset.id}: overrides.downloadTemplate`,
    );
    validateObjectKeys(
      dataset.overrides?.uploadFilters,
      ['validateEmail'],
      `${dataset.id}: overrides.uploadFilters`,
    );

    if (dataset.overrides?.downloadTemplate?.exactSelections !== undefined
      && typeof dataset.overrides.downloadTemplate.exactSelections !== 'boolean') {
      throw new Error(`${dataset.id}: exactSelections debe ser booleano.`);
    }
    if (dataset.overrides?.uploadFilters?.validateEmail !== undefined
      && typeof dataset.overrides.uploadFilters.validateEmail !== 'boolean') {
      throw new Error(`${dataset.id}: validateEmail debe ser booleano.`);
    }

    const date = dataset.overrides?.downloadTemplate?.date;
    if (date && !isValidDate(date)) {
      throw new Error(`${dataset.id}: la fecha ${date} debe ser valida y usar DD/MM/YYYY.`);
    }
  }
}

export function suggestNextBrandCpBase(): number {
  const lastEnd = Object.values(brandProfiles).reduce((max, brand) => {
    const end = brand.traceability.cpBase + scenarioIds.length - 1;
    return Math.max(max, end);
  }, 0);
  return lastEnd + 1;
}

function validateBrandProfiles(): void {
  const ranges: Array<{ brandId: string; start: number; end: number }> = [];

  for (const [brandId, brand] of Object.entries(brandProfiles)) {
    const traceability = brand.traceability as BrandProfile['traceability'];
    const { cpBase } = traceability;
    if (!Number.isInteger(cpBase) || cpBase <= 0) {
      throw new Error(`${brandId}: traceability.cpBase debe ser un entero positivo.`);
    }
    validateObjectKeys(
      traceability.cpOverrides,
      scenarioIds,
      `${brandId}: traceability.cpOverrides`,
    );

    const start = cpBase;
    const end = cpBase + scenarioIds.length - 1;
    for (const range of ranges) {
      const overlaps = start <= range.end && end >= range.start;
      if (overlaps) {
        throw new Error(
          `${brandId}: el rango CP${start}-CP${end} se solapa con ${range.brandId} CP${range.start}-CP${range.end}.`,
        );
      }
    }
    ranges.push({ brandId, start, end });
  }
}

function validateObjectKeys(
  value: object | undefined,
  allowedKeys: readonly string[],
  field: string,
): void {
  if (!value) return;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`${field}: la clave ${key} no esta permitida.`);
    }
  }
}
function requireText(value: string, field: string): void {
  if (!value.trim()) throw new Error(`Falta ${field}.`);
}

function isValidDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day;
}
