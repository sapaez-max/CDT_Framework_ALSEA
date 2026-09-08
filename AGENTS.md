# AGENTS

## Instrucciones del framework base

Este proyecto es una base reutilizable de Playwright. No debe contener acoplamientos a aplicaciones anteriores.

- Configura URLs, usuarios, credenciales, contexto y selectores por variables de entorno.
- Agrega Page Objects especificos de la nueva aplicacion en `pages/`.
- Agrega specs nuevos en `tests/e2e/`.
- Importa `test` y `expect` desde `@fixtures/base.fixture`.
- No uses esperas fijas; prefiere assertions web-first.
- No subas `.env`, `.auth`, reportes, videos, screenshots, traces ni archivos temporales.
