# Convenciones de desarrollo

## Fuente normativa

Las instrucciones obligatorias del framework están en [AGENTS.md](../../AGENTS.md). Esta guía explica su aplicación para mantenimiento humano; ante una diferencia, debe actualizarse la documentación para conservar una sola regla coherente.

## Organización

- Agrega Page Objects específicos en `pages/`.
- Agrega specs funcionales en `tests/e2e/`.
- Mantén la coordinación en `workflows/`.
- Mantén el procesamiento de Gmail y Excel en servicios o integraciones.
- Mantén las validaciones de datos fuera de los Page Objects.
- Configura URLs, cuentas, contexto y selectores mediante variables de entorno.

Los specs importan `test` y `expect` desde `@fixtures/base.fixture`.

## Esperas e interacción

Usa assertions web-first y evita esperas fijas. Los dropdowns y autocompletes de Ant Design deben operarse mediante helpers compartidos:

- No selecciones opciones dinámicas mediante índices `nth`, `first` o `last`.
- Reconstruye el locator por contenido estable justo antes de interactuar.
- Valida el valor aplicado después de la selección.
- Reintenta únicamente ante fallos técnicos de overlay o renderizado.
- No ocultes datos inexistentes ni coincidencias ambiguas.

## Datos dinámicos

Todo valor que deba ser único usa un timestamp local `YYYYMMDD_HHmmss`. Reutiliza `formatExecutionTimestamp` desde `src/utils/execution-timestamp.ts` y genera el timestamp una sola vez por ejecución.

Los casos consumidores recuperan el valor real del artefacto generado. No lo reconstruyen usando la hora actual.

## Evidencia de modificaciones

Los casos que cambian Excel, grupos modificadores o modificadores adjuntan una evidencia HTML mediante `buildModificationEvidenceHtml` de `src/reporting/modification-evidence.ts`.

La evidencia debe incluir contexto, archivo de origen, archivo de salida y valores anteriores y nuevos. Nunca debe contener credenciales, tokens, `.env` ni datos OAuth.

## Archivos excluidos

No deben versionarse:

- `.env`
- `.auth`
- Reportes
- Videos
- Screenshots
- Traces
- Descargas y archivos temporales