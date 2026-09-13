# S10: modificación de un menú existente

## Casos

- CP10: Starbucks
- CP22: Burger King
- CP34: VIPS
- CP46: Chili's

## Objetivo

Comprobar que un menú publicado puede actualizarse de manera selectiva sin perder entidades, duplicar elementos ni alterar los controles que deben conservarse.

## Flujo

1. Localiza la plantilla del menú existente.
2. Accede al portal con la sesión autorizada.
3. Consulta en Visor CORE el producto seleccionado y guarda su estado inicial.
4. Crea una copia del Excel y aplica cambios selectivos.
5. Carga filtros usando `Actualización` y `Versionar menú = Si`.
6. Publica la actualización.
7. Espera la confirmación por correo.
8. Reconsulta el producto hasta que la publicación se refleje.
9. Compara el estado inicial, el esperado y el final.

## Artefacto de entrada

En la primera ejecución utiliza el Excel del escenario 9 para el mismo dataset. Las ejecuciones posteriores toman el último Excel del propio CP y conservan una copia del origen en `source`.

## Cambios selectivos

El escenario selecciona tres grupos:

- Intercambia las posiciones del primero y el último.
- Conserva el grupo intermedio como control.
- Cambia únicamente el primer y el último modificador del primer grupo.
- Mantiene los demás grupos y modificadores como controles sin cambio.

Los nombres dinámicos de la ejecución comparten un único identificador local con formato `AUTO_CP10_YYYYMMDD_HHmmss`.

## Validación

La comparación final usa tres estados:

1. JSON inicial del producto publicado.
2. Estado esperado construido con los cambios del Excel.
3. JSON final obtenido después de la publicación.

Se valida:

- Identidad del producto y categoría.
- Cantidad total de grupos y modificadores.
- IDs únicos, sin elementos faltantes ni duplicados.
- Nombres y posiciones modificadas.
- Nombres y posiciones de los controles sin cambio.

La consulta se reintenta hasta `VISOR_PROPAGATION_TIMEOUT_MS`. Un elemento ausente, duplicado, una modificación no solicitada o una posición que no se propagó hace fallar el caso.

## Evidencias

El reporte adjunta:

- Comparación semántica inicial, esperada y final.
- Cobertura de entidades modificadas y controles.
- Resumen comparativo de cambios en Excel.
- Plantillas de origen y resultado.
- Evidencias separadas de los correos de filtros y menú.