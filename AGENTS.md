# AGENTS

## Instrucciones del framework base

Este proyecto es una base reutilizable de Playwright. No debe contener acoplamientos a aplicaciones anteriores.

- Configura URLs, usuarios, credenciales y contexto por variables de entorno.
- Mantén los selectores en los Page Objects. Solo usa variables de entorno para selectores cuando exista una necesidad real de variarlos entre ambientes o marcas.
- Agrega Page Objects específicos de la nueva aplicación en `pages/`.
- Agrega specs nuevos en `tests/e2e/`.
- Importa `test` y `expect` desde `@fixtures/base.fixture`.
- Reutiliza fixtures, helpers, utilidades, reporting y mecanismos de evidencia existentes antes de crear implementaciones nuevas.
- No uses esperas fijas; prefiere assertions web-first, auto-waiting y esperas condicionadas.
- No subas `.env`, `.auth`, reportes, videos, screenshots, traces ni archivos temporales.

## Prioridad de instrucciones

- Las reglas de este `AGENTS.md` prevalecen sobre ejemplos genéricos incluidos en Skills o documentación externa.
- Los ejemplos de un Skill deben adaptarse a la estructura y convenciones reales de este repositorio.
- Antes de crear una nueva abstracción, revisa si el framework ya dispone de un fixture, helper, Page Object, utilidad o componente reutilizable equivalente.
- No reemplaces convenciones del proyecto únicamente porque un ejemplo genérico use otra estructura.

## Uso de Playwright MCP

- Usa Playwright MCP para explorar la UI real, inspeccionar controles, validar locators y reproducir comportamiento del navegador cuando sea necesario.
- Usa MCP especialmente cuando la estructura de la UI sea desconocida, exista duda sobre un locator o un fallo no pueda explicarse solo con código, logs o traces.
- Antes de crear un locator nuevo, revisa si ya existe uno reutilizable en los Page Objects.
- No tomes el comportamiento observado mediante MCP como sustituto del requerimiento funcional.
- Distingue siempre entre comportamiento esperado y comportamiento observado. Si difieren, reporta la discrepancia; no adaptes silenciosamente el test para que la aplicación actual pase.
- Playwright MCP no sustituye la ejecución de la suite mediante `npx playwright test`.
- No uses MCP para tareas que no dependan del navegador, como cambios aislados de utilidades, configuración o refactorizaciones sin impacto en la UI.

## Independencia, dependencias y paralelismo

- Prefiere casos independientes y datos de prueba aislados.
- Ejecuta en paralelo solo los casos que no compartan datos mutables, Excel, artefactos ni dependencias funcionales.
- Cuando un flujo de negocio dependa intencionalmente de datos generados por un CP anterior, conserva y recupera el identificador real mediante el mecanismo aprobado por el framework.
- No reconstruyas identificadores dependientes usando la hora actual.

## Identificadores dinámicos únicos

- Todo dato generado por la automatización que necesite ser único entre ejecuciones debe utilizar un timestamp local con formato `YYYYMMDD_HHmmss`.
- Ejemplo correcto: `AUTO_CP7_20260911_152635`.
- No utilices únicamente `YYYYMMDD`, por ejemplo `AUTO_CP7_20260911`, porque una misma prueba puede ejecutarse varias veces durante el mismo día y provocar colisiones.
- Genera el timestamp una sola vez por ejecución del caso y reutilízalo en todos los datos relacionados, como grupo, descripción y modificadores.
- Los casos posteriores que consuman esos datos no deben reconstruir el timestamp con la hora actual; deben recuperar el valor real desde el Excel, metadata o artefacto generado.
- Antes de crear un generador nuevo, busca y reutiliza `formatExecutionTimestamp` desde `src/utils/execution-timestamp.ts`.
- Mantén la zona horaria local que usa actualmente el framework; no cambies a UTC salvo que el framework lo defina explícitamente.
- Aplica esta regla a futuros CP que generen nombres, descripciones, identificadores o datos temporales únicos.

## Evidencia visual de modificaciones

- Los casos que modifiquen datos en Excel, grupos modificadores o modificadores deben adjuntar una evidencia HTML tabular reutilizando `buildModificationEvidenceHtml` desde `src/reporting/modification-evidence.ts`.
- La evidencia debe mostrar contexto del caso, archivo origen, archivo resultado y tablas con entidad modificada, valor anterior y valor nuevo.
- Mantén las annotations, JSON, screenshots, Excel y demás evidencias técnicas existentes; el HTML es una evidencia adicional para lectura humana.
- No incluyas credenciales, tokens, `.env`, datos OAuth ni información sensible no necesaria en la evidencia.
