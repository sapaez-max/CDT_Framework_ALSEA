# Escenarios funcionales

Los 48 casos de prueba documentales se representan mediante 12 escenarios funcionales reutilizables. Cada escenario se ejecuta una vez por cada juego de datos habilitado y genera un resultado independiente para la marca, sucursal, agregador y tipo de menú configurados.

Este documento concentra la explicación funcional de todos los escenarios. Los detalles de implementación permanecen en los specs, workflows, servicios y Page Objects del framework.

## Resumen y trazabilidad

| Escenario | Casos por marca | Tag | Objetivo | Dependencia | Proyecto | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | CP1, CP13, CP25, CP37 | `@descarga-plantilla` | Solicitar y recuperar la plantilla Excel | Ninguna | `ordenamiento-descarga` | Implementado |
| S02 | CP2, CP14, CP26, CP38 | `@edicion-plantilla` | Editar los datos elegibles de la plantilla | S01 | `ordenamiento-edicion` | Implementado |
| S03 | CP3, CP15, CP27, CP39 | `@carga-filtros` | Cargar los filtros de un menú nuevo | S02 | `ordenamiento-carga-filtros` | Implementado |
| S04 | CP4, CP16, CP28, CP40 | `@carga-menu` | Publicar un menú nuevo | S03 | `ordenamiento-carga-menu` | Implementado |
| S05 | CP5, CP17, CP29, CP41 | `@visor-core` | Validar el producto publicado en Visor CORE | S04 | `ordenamiento-visor-core` | Implementado |
| S06 | CP6, CP18, CP30, CP42 | `@json` | Validar el JSON publicado | S05 | `ordenamiento-json` | Implementado |
| S07 | CP7, CP19, CP31, CP43 | `@reorden-grupos` | Cambiar el orden de grupos modificadores | S01 | `ordenamiento-reorden-grupos` | Implementado |
| S08 | CP8, CP20, CP32, CP44 | `@reorden-modificadores` | Cambiar el orden de modificadores | S01 | `ordenamiento-reorden-modificadores` | Implementado |
| S09 | CP9, CP21, CP33, CP45 | `@reorden-grupos-modificadores` | Cambiar grupos y modificadores en una ejecución | S01 | `ordenamiento-reorden-grupos-modificadores` | Implementado |
| S10 | CP10, CP22, CP34, CP46 | `@actualizar-menu` | Modificar selectivamente un menú publicado | S09 | `ordenamiento-actualizar-menu` | Implementado |
| S11 | CP11, CP23, CP35, CP47 | `@conservar-orden` | Recargar un menú conservando su orden | S10 | `ordenamiento-conservar-orden` | Implementado |
| S12 | CP12, CP24, CP36, CP48 | `@multiples-grupos` | Validar múltiples grupos modificadores | S11 | `ordenamiento-multiples-grupos` | Implementado |

## Correspondencia por marca

| Marca | Rango documental | Ejemplo de dataset |
| --- | --- | --- |
| Starbucks | CP1–CP12 | `starbucks-wtc-uber` |
| Burger King | CP13–CP24 | `burgerking-aguilas-uber` |
| VIPS | CP25–CP36 | `vips-las-torres-uber` |
| Chili's | CP37–CP48 | `chilis-aeropuerto-t1-uber` |

Si se agrega otro juego de datos para una marca, los escenarios habilitados vuelven a ejecutarse para esa combinación sin duplicar el código funcional. El reporte conserva el CP documental, la marca y el identificador del dataset.

## Dependencias funcionales

La cadena principal es:

```text
S01 → S02 → S03 → S04 → S05 → S06
```

Los escenarios de reordenamiento reutilizan la plantilla obtenida en S01 y ejecutan su propio ciclo de edición, carga y validación:

```text
S01 ─┬→ S07
     ├→ S08
     └→ S09 → S10 → S11 → S12
```

Ejecutar un escenario dependiente de forma aislada requiere que el Excel de su escenario de origen exista para el mismo identificador de corrida y dataset. Las reglas completas se encuentran en [Ejecución](../documentation/execution.md).

## S01 — Descargar plantilla

**Casos:** CP1, CP13, CP25 y CP37.

**Objetivo:** solicitar desde el portal la plantilla correspondiente al país, marca, sucursal y tipo de menú del dataset, y confirmar su recepción por correo.

**Flujo funcional:**

1. Acceder a Administración de menú.
2. Seleccionar los datos configurados para la combinación.
3. Solicitar la descarga de la plantilla.
4. Esperar hasta cinco minutos por el correo posterior a la solicitud.
5. Validar remitente, asunto y los datos disponibles en el cuerpo.
6. Guardar el archivo adjunto con extensión `.xls` o `.xlsx` en los artefactos del CP y dataset.

**Validaciones principales:** la solicitud fue aceptada, se recibió un único correo posterior al inicio del caso y el archivo Excel quedó disponible para los escenarios dependientes.

**Salida:** plantilla Excel recibida y evidencias del correo.

## S02 — Editar plantilla

**Casos:** CP2, CP14, CP26 y CP38.

**Objetivo:** preparar una copia controlada de la plantilla para identificar y validar posteriormente los cambios en el menú.

**Flujo funcional:**

1. Localizar el Excel producido por S01 para el mismo dataset.
2. Crear una copia en los artefactos del caso actual.
3. Comprobar las hojas necesarias: `Items`, `Categorias`, `GrupoModificador` y `Modificadores`.
4. Seleccionar un item con categoría no vacía, un grupo habilitado para el agregador y los modificadores relacionados.
5. Agregar el identificador temporal de la ejecución al nombre comercial del item.
6. Cambiar el nombre comercial y la descripción del grupo seleccionado.
7. Cambiar el nombre comercial de todos los modificadores relacionados en todas sus apariciones de la hoja.
8. Guardar el item, la categoría, el grupo y los modificadores elegidos para las validaciones posteriores.

**Validaciones principales:** se conservan las hojas, su orden y la cantidad de filas; solo cambian las celdas previstas y los órdenes permanecen intactos. Los modificadores se modifican en todas sus filas para que el backend lea el nombre actualizado desde la primera aparición.

**Salida:** plantilla editada y resumen comparativo de los cambios en Excel.

## S03 — Cargar filtros

**Casos:** CP3, CP15, CP27 y CP39.

**Objetivo:** cargar los filtros necesarios para crear un menú nuevo usando la plantilla editada.

**Flujo funcional:**

1. Localizar el Excel generado por S02.
2. Abrir la opción Cargar filtros.
3. Seleccionar país, marca, agregador y tipo de menú.
4. Elegir `Nuevo menú` y `Versionar menú = No`.
5. Adjuntar la plantilla e ingresar la descripción del caso.
6. Enviar la carga y esperar su resultado.
7. Cuando el dataset lo requiera, validar también el correo de procesamiento.

**Validaciones principales:** el portal acepta el archivo y la respuesta funcional indica que la carga fue enviada o procesada correctamente.

**Salida:** plantilla enviada y evidencias disponibles de la carga y del correo.

## S04 — Cargar menú nuevo

**Casos:** CP4, CP16, CP28 y CP40.

**Objetivo:** publicar el menú construido con los filtros del escenario anterior.

**Flujo funcional:**

1. Usar la plantilla asociada al resultado de S03.
2. Abrir la opción Cargar menú.
3. Seleccionar país, marca, sucursal, agregador y tipo de menú.
4. Enviar la publicación con la descripción del caso.
5. Esperar el correo de procesamiento.

**Validaciones principales:** el correo confirma el resultado satisfactorio de la publicación y coincide con la marca, el agregador y la sucursal solicitados. Si el portal agota su tiempo visual pero llega el correo satisfactorio, el correo constituye la confirmación definitiva del procesamiento.

**Salida:** plantilla de referencia y evidencias de la publicación y del correo.

## S05 — Validar en Visor CORE

**Casos:** CP5, CP17, CP29 y CP41.

**Objetivo:** comprobar que el producto y los cambios registrados en el Excel se muestran en Visor CORE.

**Flujo funcional:**

1. Localizar la plantilla esperada del menú publicado.
2. Abrir Visor CORE.
3. Seleccionar país, marca, agregador y sucursal usando el código o CECO configurado.
4. Buscar la categoría conservada durante la edición.
5. Buscar y abrir el producto seleccionado.
6. Abrir su detalle y la opción `Ver JSON` cuando sea necesaria para completar la validación.
7. Comparar los datos visibles con la plantilla.

**Validaciones principales:** categoría, producto, descripción, grupo modificador y modificadores coinciden con los valores esperados; el producto se identifica de forma única.

**Salida:** plantilla esperada, JSON obtenido y diagnóstico o captura cuando ocurre un fallo.

## S06 — Validar JSON

**Casos:** CP6, CP18, CP30 y CP42.

**Objetivo:** validar la representación publicada del menú directamente en el JSON del producto.

**Flujo funcional:**

1. Reutilizar la identidad del producto validado en S05.
2. Abrir el producto en Visor CORE.
3. Obtener el JSON publicado.
4. Comparar item, grupo, modificadores y órdenes contra la plantilla esperada.

**Validaciones principales:** aparecen los identificadores y nombres esperados, los modificadores conservan el orden definido y no faltan entidades requeridas.

**Salida:** JSON publicado del menú y plantilla usada como referencia.

## S07 — Reordenar grupos modificadores

**Casos:** CP7, CP19, CP31 y CP43.

**Objetivo:** comprobar que el orden de los grupos modificadores puede cambiarse y publicarse correctamente.

**Flujo funcional:**

1. Copiar la plantilla de S01.
2. Seleccionar un item elegible con categoría y grupos válidos.
3. Cambiar únicamente las posiciones de los grupos seleccionados.
4. Cargar los filtros y publicar el menú.
5. Esperar las confirmaciones por correo.
6. Consultar el producto en Visor CORE.

**Validaciones principales:** los grupos aparecen en el orden ascendente definido en el Excel y los modificadores conservan sus valores esperados.

**Salida:** plantilla reordenada, resumen comparativo, correos y evidencia de Visor CORE.

## S08 — Reordenar modificadores

**Casos:** CP8, CP20, CP32 y CP44.

**Objetivo:** comprobar que puede cambiarse el orden de los modificadores sin alterar el orden de sus grupos.

**Flujo funcional:**

1. Copiar la plantilla de S01.
2. Seleccionar grupos y modificadores elegibles.
3. Cambiar únicamente las posiciones de los modificadores seleccionados.
4. Cargar filtros, publicar el menú y esperar las confirmaciones.
5. Consultar el producto en Visor CORE.

**Validaciones principales:** cada modificador aparece en la posición definida dentro de su grupo y los grupos mantienen el orden esperado.

**Salida:** plantilla reordenada, resumen comparativo, correos y evidencia de Visor CORE.

## S09 — Reordenar grupos y modificadores

**Casos:** CP9, CP21, CP33 y CP45.

**Objetivo:** comprobar en una sola ejecución el cambio combinado del orden de grupos y de sus modificadores.

**Flujo funcional:**

1. Copiar la plantilla de S01.
2. Seleccionar un item, sus grupos y modificadores elegibles.
3. Cambiar las posiciones previstas de los grupos.
4. Cambiar las posiciones previstas de los modificadores.
5. Cargar filtros, publicar el menú y esperar las confirmaciones.
6. Validar el resultado en Visor CORE.

**Validaciones principales:** grupos y modificadores respetan sus nuevas posiciones, las relaciones entre entidades se conservan y no aparecen elementos inesperados.

**Salida:** plantilla reordenada, resumen comparativo, correos y evidencia de Visor CORE. Esta plantilla alimenta S10.

## S10 — Modificar menú existente

**Casos:** CP10, CP22, CP34 y CP46.

**Objetivo:** actualizar selectivamente un menú ya publicado y comprobar que no se pierdan, dupliquen o modifiquen entidades fuera del alcance previsto.

**Flujo funcional:**

1. Localizar la plantilla publicada por S09 o la última plantilla válida del propio caso.
2. Consultar el producto en Visor CORE y guardar su JSON inicial.
3. Crear una copia del Excel.
4. Aplicar los cambios selectivos de grupos y modificadores, manteniendo entidades de control sin cambios.
5. Cargar filtros usando `Actualización` y `Versionar menú = Si`.
6. Volver a publicar el menú y esperar los correos de procesamiento.
7. Consultar el mismo producto hasta observar la actualización.
8. Comparar el estado inicial, el esperado según el Excel y el estado final.

**Validaciones principales:** los cambios seleccionados se publican, los controles permanecen intactos, las cantidades se conservan y no existen IDs duplicados ni entidades faltantes.

**Salida:** comparación inicial/esperada/final, cobertura de cambios y controles, plantilla actualizada, resumen comparativo y correos.

## S11 — Conservar el orden configurado

**Casos:** CP11, CP23, CP35 y CP47.

**Objetivo:** recargar un menú publicado sin cambiar las posiciones de sus grupos y modificadores.

**Flujo funcional:**

1. Localizar la plantilla publicada por S10 para el mismo dataset.
2. Consultar el producto en Visor CORE y guardar el JSON como estado inicial.
3. Comprobar que el Excel representa el mismo producto, grupos, subgrupos, modificadores y órdenes.
4. Crear una copia y agregar un identificador `AUTO_CPxx_YYYYMMDD_HHmmss` al nombre comercial del producto.
5. Confirmar que ninguna posición, descripción, categoría, hoja o cantidad de filas cambió.
6. Cargar los filtros como actualización y volver a publicar el menú.
7. Esperar los correos de procesamiento.
8. Consultar el producto actualizado y comparar su estructura contra el estado inicial.

Cuando un grupo del Excel contiene varios códigos en `Subgrupos`, cada código se interpreta como el grupo visual independiente que presenta Visor CORE y se compara únicamente con sus modificadores relacionados.

**Validaciones principales:** cambia el nombre del producto, mientras los IDs, nombres, cantidades y posiciones de grupos y modificadores se conservan; no aparecen duplicados.

**Salida:** plantillas de origen y resultado, resumen comparativo, correos y comparación antes/después de Visor CORE.

## S12 — Validar múltiples grupos modificadores

**Casos:** CP12, CP24, CP36 y CP48.

**Objetivo:** validar el comportamiento de un producto asociado a múltiples grupos modificadores y comprobar que cada grupo conserve sus relaciones y el orden configurado.

**Flujo funcional:**

1. Localizar la plantilla publicada por S11 para el mismo dataset.
2. Consultar el producto en Visor CORE y guardar su JSON inicial.
3. Identificar el producto con múltiples grupos modificadores (mínimo 4 grupos, mínimo 2 modificadores por grupo).
4. Crear una copia del Excel y reordenar múltiples grupos y modificadores simultáneamente.
5. Cargar los filtros como actualización y volver a publicar el menú.
6. Esperar los correos de procesamiento.
7. Consultar el producto actualizado y comparar su estructura contra el estado inicial.
8. Validar que todos los grupos conserven sus modificadores y el orden configurado.

**Validaciones principales:** múltiples grupos modificadores aparecen en el orden definido, cada modificador se encuentra en su grupo correcto, no existen duplicados ni entidades faltantes.

**Salida:** plantillas de origen y resultado, resumen comparativo, correos y comparación antes/después de Visor CORE.

## Ejecución por escenario

La forma general de ejecutar un escenario es:

```powershell
node .\node_modules\playwright\cli.js test --project=<proyecto> --grep '@CPxx\b' --workers=1
```

Ejemplo para CP11:

```powershell
node .\node_modules\playwright\cli.js test --project=ordenamiento-conservar-orden --grep '@CP11\b' --workers=1
```

También se puede ejecutar por marca mediante su tag:

```powershell
node .\node_modules\playwright\cli.js test --grep '@burger-king' --workers=1
```

Consulta [Ejecución](../documentation/execution.md) para comandos, proyectos, dependencias y requisitos de artefactos. Los criterios de selección y conservación del Excel se documentan en [Procesamiento de Excel](../documentation/excel-processing.md).
