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

export function annotateExecutionContext(testInfo: TestInfo, context: ExecutionContext): void {
  testInfo.annotations.push(
    { type: 'Run ID', description: context.runId },
    { type: 'Juego de datos', description: context.datasetId },
    { type: 'Escenario funcional', description: context.scenario },
    { type: 'Pais', description: context.country },
    { type: 'Marca', description: context.brand },
    { type: 'Sucursal', description: context.branch },
    { type: 'Agregador', description: context.aggregator },
    { type: 'Tipo de menu', description: context.menuType },
  );
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
