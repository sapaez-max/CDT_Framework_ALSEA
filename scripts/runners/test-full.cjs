const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { spawnSync } = require('child_process');
const { loadDatasets } = require('../data/validate-datasets.cjs');

const scenarioProjects = {
  downloadTemplate: 'ordenamiento-descarga',
  editTemplate: 'ordenamiento-edicion',
  uploadFilters: 'ordenamiento-carga-filtros',
  uploadMenu: 'ordenamiento-carga-menu',
  validateVisor: 'ordenamiento-visor-core',
  validateJson: 'ordenamiento-json',
  reorderGroups: 'ordenamiento-reorden-grupos',
  reorderModifiers: 'ordenamiento-reorden-modificadores',
  reorderGroupsAndModifiers: 'ordenamiento-reorden-grupos-modificadores',
  updateExistingMenu: 'ordenamiento-actualizar-menu',
  preserveOrder: 'ordenamiento-conservar-orden',
  multipleGroups: 'ordenamiento-multiples-grupos',
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = loadDatasets();
  const timestamp = args.timestamp ?? formatExecutionTimestamp(new Date());
  const rl = readline.createInterface({ input, output });

  try {
    const brandId = args.brand
      ? validateBrandArg(args.brand, data.brandProfiles)
      : await selectBrand(rl, data.brandProfiles);
    const plan = buildPlan(data, brandId, timestamp, args.runId);

    if (args.dryRun) {
      printDryRun(plan);
      return;
    }

    printInteractivePlan(plan);
    if (!args.yes) {
      const confirmed = await confirm(rl, '¿Desea iniciar la ejecucion? S/N');
      if (!confirmed) {
        console.log('Corrida cancelada por el usuario.');
        return;
      }
    }

    runPlan(plan);
  } finally {
    rl.close();
  }
}

function buildPlan(data, brandId, timestamp, runIdOverride) {
  const brand = data.getBrand(brandId);
  const datasets = data.testDatasets.filter(dataset => dataset.enabled && dataset.brandId === brandId);
  if (datasets.length === 0) {
    throw new Error(`No existe un dataset habilitado para la marca ${brand.displayName}.`);
  }
  if (datasets.length > 1) {
    throw new Error(
      `La marca ${brand.displayName} tiene ${datasets.length} datasets habilitados. Esta version de test:full requiere un unico dataset permanente por marca.`,
    );
  }

  const dataset = datasets[0];
  const cases = data.scenarioIds
    .filter(scenario => dataset.enabledScenarios.includes(scenario))
    .map(scenario => ({
      scenario,
      project: scenarioProjects[scenario],
      cp: data.resolveCaseId(dataset, scenario),
    }))
    .filter(testCase => testCase.project);

  if (cases.length === 0) {
    throw new Error(`No hay escenarios implementados para ${brand.displayName}.`);
  }

  const runId = runIdOverride ?? `FULL_${brandCode(brand)}_${timestamp}`;
  return {
    runId,
    timestamp,
    artifactsDir: path.resolve('artifacts', 'runs', safeSegment(runId)),
    brand: {
      id: brandId,
      label: brand.label,
      displayName: brand.displayName,
      menuLabel: menuBrandLabel(brand),
    },
    dataset,
    cases,
  };
}

function runPlan(plan) {
  fs.mkdirSync(plan.artifactsDir, { recursive: true });
  const startedAt = new Date();
  const results = [];
  const summaryPath = path.join(plan.artifactsDir, 'run-summary.json');

  let failed = false;
  for (const testCase of plan.cases) {
    if (failed) {
      const skipped = {
        ...testCase,
        status: 'SKIPPED',
        reason: 'depende de un escenario anterior fallido',
        durationMs: 0,
      };
      results.push(skipped);
      console.log(`${testCase.cp} ........ SKIPPED`);
      continue;
    }

    console.log(`${testCase.cp} ........ RUNNING`);
    const caseStartedAt = Date.now();
    const result = spawnSync(
      process.execPath,
      [
        path.resolve('node_modules', 'playwright', 'cli.js'),
        'test',
        `--project=${testCase.project}`,
        '--grep',
        plan.dataset.id,
        '--workers=1',
      ],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          ALSEA_RUN_ID: plan.runId,
          ALSEA_EXECUTION_TIMESTAMP: plan.timestamp,
        },
      },
    );

    const exitCode = result.status ?? 1;
    const status = exitCode === 0 ? 'PASS' : 'FAIL';
    const failure = status === 'FAIL' ? readFailureDetails(plan.dataset.id) : undefined;
    const caseResult = {
      ...testCase,
      status,
      exitCode,
      durationMs: Date.now() - caseStartedAt,
      artifactDir: path.join(plan.artifactsDir, testCase.cp, plan.dataset.id),
      failureType: failure?.type,
      reason: failure?.reason,
    };
    results.push(caseResult);
    console.log(`${testCase.cp} ........ ${status}`);
    if (exitCode !== 0) failed = true;
    writeSummary(summaryPath, plan, results, startedAt, new Date(), exitCode);
  }

  const finishedAt = new Date();
  const exitCode = results.some(result => result.status === 'FAIL') ? 1 : 0;
  writeSummary(summaryPath, plan, results, startedAt, finishedAt, exitCode);
  printFinalSummary(plan, results, startedAt, finishedAt);
  process.exitCode = exitCode;
}

function printInteractivePlan(plan) {
  console.log('');
  console.log('====================================');
  console.log('CORRIDA COMPLETA');
  console.log('====================================');
  console.log(`Marca seleccionada:\n${plan.brand.menuLabel}\n`);
  console.log(`Casos a ejecutar:\n${caseRange(plan)}`);
  console.log(`Dataset actual asociado:\n${plan.dataset.id}`);
  console.log('Workers:\n1');
  console.log('====================================');
}

function printDryRun(plan) {
  console.log(`Marca: ${plan.brand.menuLabel}`);
  console.log(`Casos: ${caseRange(plan)}`);
  console.log(`Dataset actual asociado: ${plan.dataset.id}`);
  console.log('Workers: 1');
  console.log('');
  for (const testCase of plan.cases) {
    console.log(testCase.cp);
  }
  console.log('');
  console.log('No se ejecutaron pruebas (--dry-run).');
}

function printFinalSummary(plan, results, startedAt, finishedAt) {
  const passed = results.filter(result => result.status === 'PASS').length;
  console.log('');
  console.log('====================================');
  console.log('RESULTADO CORRIDA COMPLETA');
  console.log('====================================');
  for (const result of results) {
    const reason = result.reason ? ` - ${result.reason}` : '';
    console.log(`${result.cp} ${result.status}${reason}`);
  }
  console.log('');
  console.log(`Resultado:\n${passed} / ${results.length} PASS`);
  console.log(`Duracion:\n${formatDuration(finishedAt.getTime() - startedAt.getTime())}`);
  console.log(`Run ID:\n${plan.runId}`);
  console.log(`Artifacts:\n${plan.artifactsDir}`);
  console.log('====================================');
}

function writeSummary(summaryPath, plan, results, startedAt, finishedAt, exitCode) {
  const summary = {
    runId: plan.runId,
    timestamp: plan.timestamp,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    exitCode,
    brand: plan.brand,
    datasetId: plan.dataset.id,
    dataset: {
      country: plan.dataset.country,
      branch: plan.dataset.branch,
      aggregator: plan.dataset.aggregator,
      menuType: plan.dataset.menuType,
    },
    artifactsDir: plan.artifactsDir,
    workers: 1,
    cases: results,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
}

async function selectBrand(rl, brandProfiles) {
  const entries = Object.entries(brandProfiles);
  while (true) {
    console.log('Seleccione marca:');
    entries.forEach(([, brand], index) => {
      console.log(`${index + 1}. ${menuBrandLabel(brand)}`);
    });

    const answer = await askRequired(rl, '>');
    const option = Number(answer);
    if (Number.isInteger(option) && option >= 1 && option <= entries.length) {
      const [brandId, brand] = entries[option - 1];
      console.log(`Marca seleccionada:\n${menuBrandLabel(brand)}`);
      return brandId;
    }

    console.log(`Opcion invalida. Seleccione un numero entre 1 y ${entries.length}.`);
  }
}

function validateBrandArg(value, brandProfiles) {
  const normalized = normalize(value);
  const match = Object.entries(brandProfiles).find(([brandId, brand]) =>
    normalize(brandId) === normalized
    || normalize(brand.label) === normalized
    || normalize(brand.displayName) === normalized);
  if (!match) {
    throw new Error(`Marca invalida: ${value}.`);
  }
  return match[0];
}

async function askRequired(rl, question) {
  const answer = (await rl.question(`${question} `)).trim();
  if (!answer) throw new Error(`Valor requerido para ${question}`);
  return answer;
}

async function confirm(rl, question) {
  const answer = (await rl.question(`${question} `)).trim().toLowerCase();
  return answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes';
}

function readFailureDetails(datasetId) {
  const resultsPath = path.resolve('reports', 'results.json');
  const fallback = {
    type: 'FALLO_TECNICO',
    reason: 'Playwright reporto fallo. Revisar reporte HTML, traces, screenshots y evidencias del caso.',
  };
  if (!fs.existsSync(resultsPath)) return fallback;

  try {
    const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const messages = [];
    collectFailureMessages(report, datasetId, messages);
    const reason = messages.find(Boolean) ?? fallback.reason;
    return { type: classifyFailure(reason), reason };
  } catch {
    return fallback;
  }
}

function collectFailureMessages(value, datasetId, messages) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(item => collectFailureMessages(item, datasetId, messages));
    return;
  }

  const serialized = JSON.stringify(value);
  if (serialized.includes(datasetId) && Array.isArray(value.errors)) {
    for (const error of value.errors) {
      if (error?.message) messages.push(String(error.message).split('\n')[0]);
    }
  }

  for (const child of Object.values(value)) {
    collectFailureMessages(child, datasetId, messages);
  }
}

function classifyFailure(message) {
  if (/requiere un Excel|No se encontro.*archivo|No existe.*dataset|precondici[oó]n/i.test(message)) {
    return 'PRECONDICION_FALTANTE';
  }
  if (/ITEMS\s*:\s*null|ITEMS:null|carga funcional fallida|correo|portal|Visor CORE|JSON|esperado|validaci[oó]n/i.test(message)) {
    return 'FALLO_FUNCIONAL_CRITICO';
  }
  return 'FALLO_TECNICO';
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') args.dryRun = true;
    else if (token === '--yes' || token === '-y') args.yes = true;
    else if (token.startsWith('--')) {
      const key = toCamelCase(token.slice(2));
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    }
  }
  return args;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function menuBrandLabel(brand) {
  if (brand.displayName.toLowerCase() === "chili's") return "CHILI'S";
  return brand.label;
}

function caseRange(plan) {
  return `${plan.cases[0].cp} - ${plan.cases[plan.cases.length - 1].cp}`;
}

function brandCode(brand) {
  const words = brand.displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (words.length > 1) {
    return words.map(word => word[0]).join('').toUpperCase();
  }
  return (words[0] ?? 'RUN').toUpperCase().slice(0, 3);
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function safeSegment(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function formatExecutionTimestamp(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('') + '_' + [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
}

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
