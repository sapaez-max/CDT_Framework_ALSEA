const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function registerTypeScriptLoader() {
  require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText, diagnostics } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: filename,
      reportDiagnostics: true,
    });

    const errors = diagnostics.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
      const message = ts.formatDiagnosticsWithColorAndContext(errors, {
        getCanonicalFileName: value => value,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      });
      throw new Error(message);
    }

    module._compile(outputText, filename);
  };
}

function loadDatasets() {
  registerTypeScriptLoader();
  const modulePath = path.resolve(
    'tests',
    'e2e',
    'ordenamiento-gpo-mod',
    'data',
    'datasets.data.ts',
  );
  delete require.cache[modulePath];
  return require(modulePath);
}

function validateConfiguredDatasets() {
  const { scenarioIds, testDatasets, resolveCaseId } = loadDatasets();
  const enabled = testDatasets.filter(dataset => dataset.enabled);
  const cases = enabled.flatMap(dataset =>
    dataset.enabledScenarios.map(scenario => resolveCaseId(dataset, scenario)));

  console.log(`Datasets validos: ${testDatasets.length}`);
  console.log(`Datasets habilitados: ${enabled.length}`);
  console.log(`Casos habilitados: ${cases.length}`);
  console.log(`Escenarios definidos: ${scenarioIds.length}`);
  return { scenarioIds, testDatasets };
}

if (require.main === module) {
  try {
    validateConfiguredDatasets();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

module.exports = { loadDatasets, validateConfiguredDatasets };