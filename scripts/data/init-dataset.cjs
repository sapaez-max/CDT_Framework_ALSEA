const path = require('path');
const { spawnSync } = require('child_process');
const { validateConfiguredDatasets } = require('./validate-datasets.cjs');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const datasetId = process.argv[2];
if (!datasetId) {
  console.error('Uso: npm run dataset:init -- <datasetId>');
  process.exit(1);
}

let testDatasets;
let scenarioIds;
let getBrand;
let suggestNextBrandCpBase;
try {
  ({ testDatasets, scenarioIds, getBrand, suggestNextBrandCpBase } = validateConfiguredDatasets());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const dataset = testDatasets.find(candidate => candidate.id === datasetId);
if (!dataset) {
  console.error(`No existe el juego de datos ${datasetId}.`);
  const nextBase = suggestNextBrandCpBase();
  const nextEnd = nextBase + scenarioIds.length - 1;
  console.error(
    `Si corresponde a una marca nueva, registra brandProfiles.<brandId>.traceability.cpBase explicitamente. Siguiente bloque sugerido: CP${nextBase}-CP${nextEnd}.`,
  );
  process.exit(1);
}
if (!dataset.enabled) {
  console.error(`El juego de datos ${datasetId} esta deshabilitado.`);
  process.exit(1);
}
if (!dataset.enabledScenarios.includes('downloadTemplate')) {
  console.error(`${datasetId} no tiene habilitado el escenario downloadTemplate.`);
  process.exit(1);
}

const brand = getBrand(dataset.brandId);
const cpStart = brand.traceability.cpBase;
const cpEnd = cpStart + scenarioIds.length - 1;
console.log(`Trazabilidad ${brand.displayName}: CP${cpStart}-CP${cpEnd}. ${datasetId} reutiliza este rango de marca.`);

const cli = path.resolve('node_modules', 'playwright', 'cli.js');
const result = spawnSync(process.execPath, [
  cli,
  'test',
  '--project=ordenamiento-descarga',
  '--grep',
  escapeRegExp(datasetId),
  '--workers=1',
], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
