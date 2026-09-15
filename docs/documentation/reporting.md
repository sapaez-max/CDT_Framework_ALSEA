# Reporting y evidencias

## Salidas

Playwright genera:

- Reporte HTML en `playwright-report`.
- Resultados JSON y JUnit en `reports`.
- Videos, capturas, trazas y archivos de ejecución en `artifacts`.

Estas rutas no deben versionarse.

## Flujo funcional

Los doce escenarios implementados adjuntan `Flujo funcional`, una vista en lenguaje de usuario del recorrido ejecutado. Cada nodo muestra `COMPLETADO`, `FALLÓ` o `NO EJECUTADO`. Si un error ocurre fuera de un paso reconocido, el último paso alcanzado se marca como fallido.

La evidencia muestra el recorrido visual y los datos utilizados. La tabla duplicada de resultados por paso no se genera.

## Annotations

La sección Annotations conserva únicamente datos funcionales aplicables:

- Juego de datos
- País
- Marca
- Sucursal
- Agregador
- Tipo de menú
- Fecha seleccionada
- Tipo de carga y versionamiento
- Descripciones
- Item y categoría

Las rutas, IDs técnicos, datos completos del correo y resultados del portal permanecen en evidencias especializadas para evitar duplicación.

## Evidencias Excel y JSON

Los Excel se muestran como `<descripción funcional> - <nombre-real.xls|xlsx>`. Entre los nombres utilizados están:

- `Plantilla Excel recibida - <archivo>`
- `Plantilla Excel editada - <archivo>`
- `Plantilla enviada para carga de filtros - <archivo>`
- `Plantilla utilizada para generar el menú - <archivo>`
- `Plantilla esperada para validación en Visor CORE - <archivo>`
- `Plantilla Excel reordenada - <archivo>`

Los casos que modifican datos adjuntan `Resumen comparativo de cambios en Excel`. Las validaciones del Visor y la actualización de menú adjuntan el JSON obtenido y comparaciones legibles cuando corresponda. S06 adjunta `Comparación de datos esperados y obtenidos en el JSON`, con una fila por entidad para comparar identificador, nombre y posición, además del orden completo de los modificadores. Esta comparación también determina el resultado del test: cualquier fila con `No coincide` provoca el fallo del caso.

## Evidencias de Gmail

La descarga inicial utiliza:

- `Validación del correo recibido`
- `Detalle técnico de validación del correo`

Los procesos posteriores identifican el origen:

- `Validación del correo de carga de filtros`
- `Detalle técnico del correo de carga de filtros`
- `Validación del correo de carga de menú`
- `Detalle técnico del correo de carga de menú`

## Fallos

Playwright conserva video, screenshot y trace según la configuración. El archivo automático `error-context.md` se presenta como `Contexto técnico del fallo`. Los diagnósticos adicionales del Visor mantienen el error original aunque un panel secundario no pueda abrirse.

No se incluyen credenciales, sesiones, `.env`, archivos OAuth ni tokens en las evidencias.
