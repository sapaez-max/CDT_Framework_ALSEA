# Framework Playwright - Alsea Delivery

Framework de automatización E2E para validar los flujos de ordenamiento de grupos modificadores y modificadores de Alsea Delivery.

## Estado actual

Los 48 casos documentales se representan mediante 12 escenarios funcionales reutilizables y juegos de datos por marca. Están implementados los escenarios 1 al 12, que cubren CP1-CP12, CP13-CP24, CP25-CP36 y CP37-CP48.

## Stack

- Node.js 20 o superior
- TypeScript
- Playwright
- SheetJS (`xlsx`)
- Google Gmail API con OAuth 2.0

## Preparación

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env
npm run typecheck
npm run data:validate
npm run test:list
```

Configura en `.env` las variables del ambiente, la cuenta esperada y las rutas locales de autenticación. No guardes credenciales, tokens ni sesiones en el repositorio.

## Autenticación

El ambiente DEV requiere capturar manualmente una sesión desde una instancia independiente de Chrome:

```powershell
npm run auth:manual
```

Después del acceso manual, vuelve a la terminal, presiona Enter y valida la sesión guardada:

```powershell
npm run test:session
```

La sesión se almacena en `.auth/admin.json`, está excluida por Git y no debe compartirse. Consulta [Autenticación](docs/documentation/authentication.md) para conocer expiración, configuración de Chrome y diagnóstico.

## Ejecución

```powershell
npm test
npm run test:full
npm run test:headed
npm run report
```

`npm test` ejecuta la suite configurada y registra el historial básico de la corrida. `npm run test:smoke` valida actualmente la sesión autenticada; todavía no existe una selección funcional de regresión mediante `@regression`.

`npm run test:full` abre un asistente para ejecutar la corrida completa de una marca usando el dataset permanente ya configurado. Solo solicita la marca, resuelve sus CP con la configuración actual y ejecuta Playwright con `workers=1`. Para validar sin abrir navegador ni consultar Gmail:

```powershell
npm run test:full -- --dry-run
```

Ejemplos de ejecución dirigida:

```powershell
npx playwright test --grep "@burger-king"
node node_modules/playwright/cli.js test --grep '@CP13\b' --workers=1
node node_modules/playwright/cli.js test --project=ordenamiento-carga-menu --grep '@CP16\b' --workers=1
node node_modules/playwright/cli.js test --grep '(?=.*@descarga-plantilla)(?=.*@burger-king)'
```

Para iniciar una combinación nueva, ejecuta `npm run dataset:init -- <datasetId>` después de validar sus datos.

Los escenarios dependientes consumen el Excel generado por el escenario anterior. Para ejecutar un CP de forma independiente, su artefacto de entrada debe existir y corresponder al mismo juego de datos. Consulta [Ejecución](docs/documentation/execution.md) para ver proyectos, dependencias, timeouts y comandos adicionales.

## Tags

Cada prueba utiliza una taxonomía de cuatro etiquetas:

| Nivel          | Ejemplo                   |
| -------------- | ------------------------- |
| Solución      | `@ordenamiento-gpo-mod` |
| Escenario      | `@carga-menu`           |
| Caso de prueba | `@CP16`                 |
| Marca          | `@burger-king`          |

## Arquitectura resumida

```text
tests/e2e/ordenamiento-gpo-mod/
├── scenarios/     Specs reutilizables
├── workflows/     Coordinación de flujos funcionales
├── services/      Operaciones de Gmail y Excel
├── validators/    Validaciones fuera de las páginas
├── data/          Datasets y generación de casos
└── support/       Contexto de ejecución y artefactos

pages/              Page Objects por pantalla
src/integrations/   Clientes de servicios externos
src/reporting/      Evidencias y reporters
src/utils/          Procesamiento y utilidades compartidas
```

Cada escenario se implementa una vez y genera una ejecución independiente por cada juego de datos habilitado. El CP documental pertenece a la marca; el reporte conserva también el `datasetId` para distinguir sucursal, agregador, tipo de menú y artefactos. Consulta [Arquitectura](docs/documentation/architecture.md) para conocer las responsabilidades de cada capa.

## Modelo de artefactos

El framework usa un modelo **Copy-on-Write** para los archivos Excel:

| Tipo de CP | Comportamiento | Ejemplo |
|------------|----------------|---------|
| **Descarga** | Crea el primer Excel desde el correo | CP1, CP13, CP25, CP37 |
| **Modificación** | Copia el Excel del CP fuente y lo edita | CP2, CP7, CP8, CP9, CP10, CP11, CP12 |
| **Solo lectura** | Referencia el Excel existente sin copiar | CP3, CP4, CP5, CP6 |

```text
artifacts/runs/{runId}/
├── CP1/template.xlsx          ← CREADO (descarga)
├── CP2/edited.xlsx            ← CREADO (modifica)
│   CP3/ → referencia CP2      ← NO crea archivo nuevo
│   CP4/ → referencia CP2      ← NO crea archivo nuevo
│   CP5/ → referencia CP2      ← NO crea archivo nuevo
│   CP6/ → referencia CP2      ← NO crea archivo nuevo
├── CP7/reorder-groups.xlsx    ← CREADO (modifica)
├── CP8/reorder-mods.xlsx      ← CREADO (modifica)
├── CP9/reorder-both.xlsx      ← CREADO (modifica)
├── CP10/update.xlsx           ← CREADO (modifica)
├── CP11/preserve.xlsx         ← CREADO (modifica)
└── CP12/multiple.xlsx         ← CREADO (modifica)
```

**Beneficios:**
- Menos archivos redundantes en disco
- Cada ejecución (`runId`) aísla sus artefactos para preservar reportes históricos
- Los CPs de solo lectura apuntan al archivo más reciente del CP fuente

En ejecuciones directas, los artifacts se guardan en `artifacts/runs/manual/`. En ejecuciones con `test:full`, se genera un `runId` con formato `BK_20260915_103045` (código de marca + timestamp) para aíslar cada corrida.

## Documentación

- [Autenticación](docs/documentation/authentication.md)
- [Ejecución, proyectos y dependencias](docs/documentation/execution.md)
- [Arquitectura](docs/documentation/architecture.md)
- [Juegos de datos](docs/documentation/datasets.md)
- [Procesamiento de Excel](docs/documentation/excel-processing.md)
- [Integración con Gmail](docs/integrations/gmail.md)
- [Reporting y evidencias](docs/documentation/reporting.md)
- [Convenciones de desarrollo](docs/documentation/development-guidelines.md)
- [Escenarios funcionales](docs/scenarios/README.md)
- [Catálogo documental de casos de prueba](docs/documentation/catalogo_casos_prueba_ordenamiento_gpo_mod_mod_agosto.md)
