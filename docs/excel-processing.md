# Procesamiento de Excel

## Artefactos de entrada y salida

Cada caso trabaja sobre una copia localizada dentro de su corrida, CP y dataset. Antes de modificar un archivo, el servicio exige una única coincidencia válida. No selecciona arbitrariamente entre varios Excel.

Los casos de edición CP2, CP14, CP26 y CP38 consumen respectivamente los archivos de CP1, CP13, CP25 y CP37. Los casos posteriores toman el resultado del escenario anterior para la misma combinación.

## Selección para edición

La edición automática selecciona un item que cumpla todas estas condiciones:

- Existe en la hoja `Items`.
- Tiene una categoría no vacía en la hoja `Categorias`.
- Está relacionado con un grupo modificador con identificador.
- El grupo está habilitado con `*` para el agregador del dataset.
- El grupo tiene al menos dos modificadores relacionados y habilitados para ese agregador.

Según el formato de la marca, la categoría se obtiene de las columnas `Categoria` o `Nombre Categoria`. El item y su categoría se conservan para las validaciones posteriores en Visor CORE.

## Cambios del escenario de edición

La copia editada:

- Agrega al nombre comercial del item seleccionado el timestamp de la ejecución.
- Cambia el nombre comercial y la descripción del grupo modificador.
- Cambia el nombre comercial de sus dos primeros modificadores relacionados.
- Mantiene órdenes, posiciones y columnas de agregadores sin cambios.

Los datos dinámicos usan un timestamp local `YYYYMMDD_HHmmss`, generado una sola vez mediante `formatExecutionTimestamp`. Los escenarios posteriores recuperan los valores reales del artefacto; no construyen otro timestamp.

## Integridad

Después de guardar se verifica:

- La existencia de `Items`, `GrupoModificador` y `Modificadores`.
- La conservación de todas las hojas y su orden.
- La cantidad original de filas.
- Los valores de las celdas modificadas.

Los casos que modifican Excel adjuntan una copia del archivo y el HTML `Resumen comparativo de cambios en Excel`, generado mediante `buildModificationEvidenceHtml`.

## Correspondencia con Visor CORE

El producto se busca mediante nombre comercial y precios de las columnas `Price Level`. Si persisten varias coincidencias, se usa `Daypart`. Una ausencia o ambigüedad falla mostrando las coincidencias encontradas.

La sucursal se selecciona mediante `branch.code` o CECO, porque el Visor muestra el código separado del nombre. Las pantallas de descarga y carga utilizan la etiqueta completa configurada en `branch.label`.

Después de abrir la previsualización, el flujo pulsa `Ver JSON` y valida item, descripción, grupo modificador, modificadores y orden contra el Excel. En la validación completa de conservación del orden, los códigos declarados en la columna `Subgrupos` se resuelven con la hoja `Subgrupos`; así, un grupo base asociado a varios códigos se compara como los grupos independientes que presenta Visor CORE. La regla de horarios de vigencia permanece pendiente de confirmación del cliente.