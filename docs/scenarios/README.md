# Escenarios funcionales

Los 48 CP se generan a partir de 12 escenarios reutilizables. Cada escenario se ejecuta por los datasets habilitados y mantiene un número de CP independiente.

| Escenario | Tag | Descripción | Estado |
| --- | --- | --- | --- |
| S01 | `@descarga-plantilla` | Solicitar la plantilla y recuperarla desde Gmail | Implementado |
| S02 | `@edicion-plantilla` | Editar item, grupo y modificadores elegibles | Implementado |
| S03 | `@carga-filtros` | Cargar los filtros del menú | Implementado |
| S04 | `@carga-menu` | Publicar un menú nuevo y confirmar el resultado | Implementado |
| S05 | `@visor-core` | Validar el producto en Visor CORE contra el Excel | Implementado |
| S06 | `@json` | Validar el JSON publicado contra el Excel | Implementado |
| S07 | `@reorden-grupos` | Cambiar el orden de grupos modificadores | Implementado |
| S08 | `@reorden-modificadores` | Cambiar el orden de modificadores | Implementado |
| S09 | `@reorden-grupos-modificadores` | Cambiar grupos y modificadores en una ejecución | Implementado |
| S10 | `@actualizar-menu` | Modificar selectivamente un menú publicado | Implementado |
| S11 | `@conservar-orden` | Recargar un menú conservando el orden configurado | Implementado |
| S12 | Por definir | Validar múltiples grupos modificadores | Pendiente |

## Correspondencia por marca

| Marca | Rango documental |
| --- | --- |
| Starbucks | CP1-CP12 |
| Burger King | CP13-CP24 |
| VIPS | CP25-CP36 |
| Chili's | CP37-CP48 |

Los escenarios 1 al 11 cubren actualmente CP1-CP11, CP13-CP23, CP25-CP35 y CP37-CP47.

## Cadena inicial

S01 genera el Excel recibido; S02 lo edita; S03 carga filtros; S04 publica el menú; S05 valida el Visor y S06 valida el JSON. S07, S08 y S09 realizan nuevas modificaciones de orden sobre los artefactos anteriores. S10 parte del menú publicado y compara su estado antes y después de una actualización selectiva.

Consulta [Ejecución](../execution.md) para las reglas de dependencia y [Procesamiento de Excel](../excel-processing.md) para los criterios de selección. El detalle especial de S10 está en [S10: modificación de un menú existente](S10-update-existing-menu.md).