# AGENTS

## Instrucciones del framework base

Este proyecto es una base reutilizable de Playwright. No debe contener acoplamientos a aplicaciones anteriores.

- Configura URLs, usuarios, credenciales, contexto y selectores por variables de entorno.
- Agrega Page Objects especificos de la nueva aplicacion en `pages/`.
- Agrega specs nuevos en `tests/e2e/`.
- Importa `test` y `expect` desde `@fixtures/base.fixture`.
- No uses esperas fijas; prefiere assertions web-first.
- No subas `.env`, `.auth`, reportes, videos, screenshots, traces ni archivos temporales.

## Identificadores dinamicos unicos

- Todo dato generado por la automatizacion que necesite ser unico entre ejecuciones debe utilizar un timestamp local con formato `YYYYMMDD_HHmmss`.
- Ejemplo correcto: `AUTO_CP7_20260911_152635`.
- No utilices unicamente `YYYYMMDD`, por ejemplo `AUTO_CP7_20260911`, porque una misma prueba puede ejecutarse varias veces durante el mismo dia y provocar colisiones.
- Genera el timestamp una sola vez por ejecucion del caso y reutilizalo en todos los datos relacionados, como grupo, descripcion y modificadores.
- Los casos posteriores que consuman esos datos no deben reconstruir el timestamp con la hora actual; deben recuperar el valor real desde el Excel, metadata o artefacto generado.
- Antes de crear un generador nuevo, busca y reutiliza `formatExecutionTimestamp` desde `src/utils/execution-timestamp.ts`.
- Mantén la zona horaria local que usa actualmente el framework; no cambies a UTC salvo que el framework lo defina explicitamente.
- Aplica esta regla a futuros CP que generen nombres, descripciones, identificadores o datos temporales unicos.

## Evidencia visual de modificaciones

- Los casos que modifiquen datos en Excel, grupos modificadores o modificadores deben adjuntar una evidencia HTML tabular reutilizando `buildModificationEvidenceHtml` desde `src/reporting/modification-evidence.ts`.
- La evidencia debe mostrar contexto del caso, archivo origen, archivo resultado y tablas con entidad modificada, valor anterior y valor nuevo.
- Mantén las annotations, JSON, screenshots, Excel y demas evidencias tecnicas existentes; el HTML es una evidencia adicional para lectura humana.
- No incluyas credenciales, tokens, `.env`, datos OAuth ni informacion sensible no necesaria en la evidencia.
