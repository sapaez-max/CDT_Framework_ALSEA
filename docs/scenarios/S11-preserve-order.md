# S11: conservación del orden en una recarga

## Casos cubiertos

- CP11: Starbucks
- CP23: Burger King
- CP35: VIPS
- CP47: Chili's

## Objetivo

Comprobar que una recarga real de un menú publicado conserva las posiciones de todos los grupos modificadores y de sus modificadores. El nombre del producto cambia únicamente para identificar que la nueva publicación fue procesada.

## Flujo

1. Toma como origen la plantilla publicada por el escenario 10 de la misma combinación.
2. Consulta el producto en Visor CORE y guarda el JSON como baseline.
3. Comprueba que el Excel representa el mismo producto, grupos, subgrupos, modificadores y órdenes del baseline.
4. Crea una copia del Excel y agrega un identificador `AUTO_CPxx_YYYYMMDD_HHmmss` al nombre comercial del producto.
5. Verifica en la copia que ninguna posición, descripción, categoría, hoja o cantidad de filas cambió.
6. Actualiza los filtros y publica nuevamente el menú existente.
7. Espera los correos de procesamiento configurados.
8. Consulta el mismo producto y compara el estado final con el baseline.

## Criterios de aceptación

- El nombre final del producto contiene el identificador de la ejecución.
- Los IDs, nombres, cantidades y posiciones de los grupos son idénticos al baseline.
- Cuando un grupo del Excel enumera varios códigos en `Subgrupos`, cada código se compara como el grupo visual independiente que presenta Visor CORE, usando su nombre de la hoja `Subgrupos` y únicamente sus modificadores relacionados.
- Los IDs, nombres, cantidades y posiciones de los modificadores son idénticos dentro de cada grupo.
- No aparecen grupos ni modificadores duplicados.
- El reporte adjunta las plantillas, el resumen comparativo, los correos y la comparación antes/después del Visor CORE.

## Ejecución independiente

```powershell
node .\node_modules\playwright\cli.js test --project=ordenamiento-conservar-orden --grep '@CP11\b' --workers=1
```

CP11 requiere que CP10 haya publicado previamente el Excel de la misma ejecución y juego de datos.
