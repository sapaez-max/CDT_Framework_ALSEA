import type { TestInfo } from '@fixtures/base.fixture';
import { getBrand } from '../data/catalog.data';
import { getDataset } from '../data/datasets.data';
import type { CaseMetadata } from '../data/types';
import type { ArtifactScope } from '@utils/case-artifact-manager';

export type EntityChange = {
  id: string;
  nameBefore?: string;
  nameAfter?: string;
  descriptionBefore?: string;
  descriptionAfter?: string;
};

export type ExecutionContext = {
  runId: string;
  cp: string;
  scenario: string;
  datasetId: string;
  country: string;
  brand: string;
  branch: string;
  aggregator: string;
  menuType: string;
  product?: { id: string; name?: string };
  category?: { name: string };
  groupModifier?: EntityChange;
  modifiers: EntityChange[];
  files: {
    downloaded?: string;
    edited?: string;
    uploaded?: string;
  };
};

export function createExecutionContext(caseData: CaseMetadata): ExecutionContext {
  const dataset = getDataset(caseData.datasetId);
  const brand = getBrand(dataset.brandId);

  return {
    runId: process.env.ALSEA_RUN_ID ?? 'manual',
    cp: caseData.id,
    scenario: caseData.scenario,
    datasetId: dataset.id,
    country: dataset.country,
    brand: brand.name,
    branch: dataset.branchCode,
    aggregator: dataset.aggregator,
    menuType: dataset.menuType,
    modifiers: [],
    files: {},
  };
}

export function artifactScope(context: ExecutionContext): ArtifactScope {
  return { runId: context.runId, datasetId: context.datasetId };
}

type FunctionalAnnotationData = CaseMetadata & Partial<{
  downloadDate: string;
  loadType: string | string[];
  versionMenu: string | string[];
  description: string;
  filterDescription: string;
  menuDescription: string;
}>;

export function annotateExecutionContext(
  testInfo: TestInfo,
  context: ExecutionContext,
  caseData: FunctionalAnnotationData,
): void {
  testInfo.annotations.push(
    { type: 'Juego de datos', description: context.datasetId },
    { type: 'Pais', description: context.country },
    { type: 'Marca', description: context.brand },
  );

  if (caseData.scenario !== 'uploadFilters') {
    addFunctionalAnnotation(testInfo, 'Sucursal', context.branch);
  }
  if (caseData.scenario !== 'downloadTemplate') {
    addFunctionalAnnotation(testInfo, 'Agregador', context.aggregator);
  }
  addFunctionalAnnotation(testInfo, 'Tipo de menu', context.menuType);
  addFunctionalAnnotation(testInfo, 'Fecha seleccionada', caseData.downloadDate);
  addFunctionalAnnotation(testInfo, 'Tipo de carga', firstValue(caseData.loadType));
  addFunctionalAnnotation(testInfo, 'Versionar menu', firstValue(caseData.versionMenu));
  addFunctionalAnnotation(testInfo, 'Descripcion', caseData.description);
  addFunctionalAnnotation(testInfo, 'Descripcion de filtros', caseData.filterDescription);
  addFunctionalAnnotation(testInfo, 'Descripcion de menu', caseData.menuDescription);
}

export function annotateItemAndCategory(testInfo: TestInfo, context: ExecutionContext): void {
  if (context.product) {
    testInfo.annotations.push({
      type: 'Item seleccionado',
      description: [context.product.id, context.product.name].filter(Boolean).join(' - '),
    });
  }
  if (context.category) {
    testInfo.annotations.push({
      type: 'Categoria del item',
      description: context.category.name,
    });
  }
}


function addFunctionalAnnotation(testInfo: TestInfo, type: string, description?: string): void {
  if (description) testInfo.annotations.push({ type, description });
}

function firstValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
