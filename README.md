# Framework base Playwright

Proyecto base independiente para automatizacion E2E con Playwright y TypeScript.

## Configuracion inicial

1. Ejecuta `npm install`.
2. Copia `.env.example` a `.env`.
3. Configura `BASE_URL` y, si aplica autenticacion, `APP_USERNAME`, `APP_PASSWORD`, `AUTH_ENABLED=true` y los selectores `LOGIN_*`.
4. Agrega Page Objects nuevos en `pages/` y specs en `tests/e2e/`.

## Scripts

- `npm test`: ejecuta Playwright con historial basico de corrida.
- `npm run test:raw`: ejecuta Playwright directamente.
- `npm run test:headed`: ejecuta con navegador visible.
- `npm run test:ui`: abre Playwright UI.
- `npm run test:smoke`: ejecuta pruebas etiquetadas con `@smoke`.
- `npm run test:regression`: ejecuta pruebas etiquetadas con `@regression`.
- `npm run report`: abre el reporte HTML.

## Convenciones

- Importa `test` y `expect` desde `@fixtures/base.fixture`.
- Evita esperas fijas; usa assertions web-first.
- Mantiene URLs, credenciales, contexto y rutas en `.env` o configuracion, no en specs.
- Mantiene Page Objects de negocio separados por modulo de la nueva aplicacion.
