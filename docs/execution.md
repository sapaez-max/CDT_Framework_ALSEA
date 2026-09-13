# Ejecución

## Comandos principales

| Comando | Resultado |
| --- | --- |
| `npm test` | Ejecuta la suite y registra el historial básico en `reports/history` |
| `npm run test:raw` | Ejecuta Playwright sin el runner de historial |
| `npm run test:headed` | Ejecuta con navegador visible |
| `npm run test:ui` | Abre Playwright UI |
| `npm run test:list` | Lista las pruebas descubiertas |
| `npm run data:validate` | Valida datasets, escenarios y CP sin acceder al portal |
| `npm run dataset:init -- <datasetId>` | Ejecuta la descarga inicial de un dataset |
| `npm run test:smoke` | Valida actualmente la sesión guardada |
| `npm run report` | Abre el último reporte HTML |
| `npm run typecheck` | Valida TypeScript sin generar archivos |

`npm run test:regression` existe en `package.json`, pero todavía no hay pruebas con `@regression`. No debe considerarse una selección funcional disponible hasta definir su alcance.

## Proyectos de Playwright

Los escenarios están separados por etapa:

- `ordenamiento-descarga`
- `ordenamiento-edicion`
- `ordenamiento-carga-filtros`
- `ordenamiento-carga-menu`
- `ordenamiento-visor-core`
- `ordenamiento-json`
- `ordenamiento-reorden-grupos`
- `ordenamiento-reorden-modificadores`
- `ordenamiento-reorden-grupos-modificadores`
- `ordenamiento-actualizar-menu`
- `ordenamiento-conservar-orden`

El proyecto `chromium` ejecuta pruebas generales fuera de la solución de ordenamiento, incluida la validación de sesión.

## Ejecución dirigida

```powershell
npx playwright test --grep "@starbucks"
node node_modules/playwright/cli.js test --grep '@CP13\b' --workers=1
node node_modules/playwright/cli.js test --project=ordenamiento-carga-menu --grep '@CP16\b' --workers=1
node node_modules/playwright/cli.js test --grep '@CP1|@CP13|@CP25|@CP37'
node node_modules/playwright/cli.js test --grep '(?=.*@descarga-plantilla)(?=.*@burger-king)'
```

En PowerShell se llama directamente a `node_modules/playwright/cli.js` cuando una expresión contiene `|`, evitando que el shell la interprete como una tubería.

## Inicialización de un dataset

Después de registrar una combinación:

```powershell
npm run data:validate
npm run dataset:init -- starbucks-wtc-rappi
```

El segundo comando valida la configuración y ejecuta el proyecto `ordenamiento-descarga` filtrado por el `datasetId`. Utiliza el workflow normal, la sesión y la integración de Gmail configurados; no duplica la lógica de descarga.
## Dependencias entre escenarios

La cadena funcional es:

```text
Descargar → Editar → Cargar filtros → Cargar menú → Validar Visor → Validar JSON
          → Reordenar grupos → Reordenar modificadores
          → Reordenar grupos y modificadores → Actualizar menú existente
          → Recargar conservando el orden
```

La relación entre casos se mantiene mediante artefactos Excel. Un caso dependiente requiere exactamente un Excel generado por el caso anterior para el mismo juego de datos. Si falta o hay una coincidencia ambigua, el helper falla con un mensaje descriptivo y no ejecuta automáticamente el caso previo.

En su primera ejecución, CP10, CP22, CP34 y CP46 requieren el Excel del escenario 9. CP11, CP23, CP35 y CP47 consumen el Excel publicado por esos casos. En ejecuciones posteriores, los escenarios 10 y 11 reutilizan el último Excel de su propio caso y conservan una copia del estado de origen en el subdirectorio `source`.

## Artefactos

Cada corrida usa un identificador y separa los archivos por CP y juego de datos:

```text
artifacts/runs/<runId>/<CP>/<datasetId>/
```

Los reportes se generan en `playwright-report`, `reports` y `artifacts`. Todas estas rutas están excluidas del repositorio.

## Tiempos

| Variable | Uso |
| --- | --- |
| `TEST_TIMEOUT_MS` | Límite general del caso |
| `ACTION_TIMEOUT_MS` | Acciones de Playwright |
| `EXPECT_TIMEOUT_MS` | Assertions web-first |
| `NAVIGATION_TIMEOUT_MS` | Navegaciones |
| `FILE_OPERATION_TIMEOUT_MS` | Operaciones de archivos |
| `GMAIL_POLL_TIMEOUT_MS` | Espera independiente de correo |
| `VISOR_PROPAGATION_TIMEOUT_MS` | Propagación de una publicación en Visor CORE |

La línea base utiliza 80, 30, 35, 50 y 50 segundos para los cinco primeros valores. Gmail y la propagación del Visor usan cinco minutos por defecto.