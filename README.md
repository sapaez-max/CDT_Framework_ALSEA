# Framework Playwright - Alsea Delivery

Framework de automatización E2E para validar los flujos de ordenamiento de grupos modificadores y modificadores de Alsea Delivery.

## Estado actual

Los 48 casos documentales se representan mediante 12 escenarios funcionales reutilizables y juegos de datos por marca. Están implementados los escenarios 1 al 11, que cubren CP1-CP11, CP13-CP23, CP25-CP35 y CP37-CP47. Permanece pendiente la validación de múltiples grupos modificadores.

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
npm run test:headed
npm run report
```

`npm test` ejecuta la suite configurada y registra el historial básico de la corrida. `npm run test:smoke` valida actualmente la sesión autenticada; todavía no existe una selección funcional de regresión mediante `@regression`.

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

Cada escenario se implementa una vez y genera una ejecución independiente por cada juego de datos habilitado. El reporte conserva el CP, la marca y la combinación utilizada. Consulta [Arquitectura](docs/documentation/architecture.md) para conocer las responsabilidades de cada capa.

## Documentación

- [Autenticación](docs/documentation/authentication.md)
- [Ejecución, proyectos y dependencias](docs/documentation/execution.md)
- [Arquitectura](docs/documentation/architecture.md)
- [Juegos de datos](docs/documentation/datasets.md)
- [Procesamiento de Excel](docs/documentation/excel-processing.md)
- [Integración con Gmail](docs/documentation/integrations/gmail.md)
- [Reporting y evidencias](docs/documentation/reporting.md)
- [Convenciones de desarrollo](docs/documentation/development-guidelines.md)
- [Escenarios funcionales](docs/documentation/scenarios/README.md)
- [Catálogo documental de casos de prueba](docs/documentation/catalogo_casos_prueba_ordenamiento_gpo_mod_mod_agosto.md)
