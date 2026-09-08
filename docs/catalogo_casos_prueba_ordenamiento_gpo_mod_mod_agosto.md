# Catalogo de casos de prueba - OrdenamientoGpoMod&Mod 2.0

---

## Estandar aplicado
Este catalogo se adapto al formato existente en `docs/catalogo_casos_prueba_demo.md`: agrupacion por `Escenario`, bloque `Caso de prueba`, bandera `Implementado`, y secciones de titulo, descripcion, precondiciones, datos, pasos y resultado esperado.

Tambien se consideraron las convenciones del framework documentadas en `README.md` y `AGENTS.md`: los escenarios documentales se mantienen en `docs/`, la automatizacion futura debe vivir en `tests/e2e/`, y las specs deberan importar `test` y `expect` desde `@fixtures/base.fixture` sin esperas fijas.

## Trazabilidad del Excel
- Archivo fuente: `docs/MP_OrdenamientoGpoMod_Mod_AGOSTO.xlsx`
- Hojas con casos incluidas: `SBX`, `BK`, `VIPS`, `Chili´s`
- Hojas revisadas sin incorporarse como casos: `Data` (catalogo de valores) y `Hoja1` (mapa de secciones/reportes, sin IDs de caso).
- Total de casos identificados: 48
- Total de casos incluidos: 48
- Rango de IDs conservado: `CP1` a `CP48`

## Catalogos auxiliares detectados

### Valores de la hoja Data
- Estatus: Pasado, Fallado, Bloqueado, Pendiente, Descartado
- Estado: Abierto, En revisión, Cerrado, Pospuesto, Cancelado
- Tipo: Defecto, Mejora, Observación
- Prioridad: Alta, Media, Baja
- Severidad: Alta, Media, Baja

### Referencia de secciones detectada en Hoja1
- Bitácora de Horneo
- Cierre de dia
- Indicadores
- Decision Center
- Gestion de Servicios
- Mesa de Servicios
- Evaluame
- Mensajeria
- Okta
- Outlook
- Workplace
- Teams
- Enlace
- HUB del Gerente
- Hub-ADN Alsea
- Hub-EMI
- Hub-Delivery Alsea
- Hub-Alsea College
- Hub-Carpeta Legal
- Hub-Kronos
- Hub-Medallia
- Hub-Oracle
- Hub-HCM
- Horarios
- Asistencias
- CAEA
- ICA Web
- Portal SMART
- HME Cloud
- Inventory App
- Terminales bancarias

---

## Escenario: OrdenamientoGpoMod&Mod 2.0 - Starbucks
**Descripcion:** Validar el flujo funcional de descarga, edicion, carga, publicacion y verificacion de ordenamiento de grupos modificadores y modificadores para Starbucks.

**Modulo/Bloque:** Menú > Administración / Visor CORE
**Hoja origen:** `SBX`
**Casos incluidos:** 12
**Etiquetas sugeridas:** `@catalogo` `@menu` `@administracion` `@visor-core` `@ordenamiento-gpo-mod` `@starbucks`

### Caso de prueba: CP1
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 2
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Descarga de plantilla para registro de filtros.

**Descripcion:**
- Validar que el envío y la descarga de la plantilla para registrar filtros se realice correctamente y que el archivo se reciba en el correo del usuario.

**Precondiciones:**
- Disponer de credenciales de acceso vigentes que permitan una autenticación exitosa en el portal de administración de Alsea:
- https://dev.admin.delivery.alsea.net/login/

**Datos:**
- País: México
- Marca: Starbucks
- Sucursal base: 38109 (WTC)
- Tipo de menú: Delivery
- Sucursal hija: 38119 (Lomas Verdes)
- Tipo menú: Delivery BIS

**Pasos:**
1. Ingresar a Menú y elegir la opción "Administración".
2. Dar clic en "Descargar plantilla".
3. Ingresar la siguiente información de la plantilla:
- País: México
- Marca: Starbucks
- Sucursal base: 38109 (WTC)
- Tipo de menú: Delivery
- Sucursal hija: 38119 (Lomas Verdes)
- Tipo menú: Delivery BIS
4. Seleccionar fecha (la selección de fecha es opcional)
5. Dar clic en botón "Descargar plantilla".

**Resultado esperado:**
- El portal de administración muestra mensaje de confirmación y envía la plantilla en formato Excel al correo electrónico del usuario.

---

### Caso de prueba: CP2
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 3
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Edición de plantilla.

**Descripcion:**
- Validar que en la plantilla el usuario personalice los datos de "Grupo modificador" y "Modificadores" para Starbucks, específicamente los campos Nombre comercial, Descripción y Orden, para publicar en el agregador.

**Precondiciones:**
- La plantilla ha sido descargada correctamente y se encuentra disponible para su edición.

**Datos:**
- Nombre comercial del modificador [Columna E]
- Descripción del modificador [Columna F]
- Orden [Columna H]
- Agregador [Columnas I-L]

**Pasos:**
1. Abrir la plantilla y navegar a la pestaña "Items".
2. Localizar el ID del producto que se va a modificar.
3. Acceder a la pestaña "Grupo modificador" y completar los siguientes campos:
- Nombre comercial del modificador [Columna E]
- Es el nombre que se verá en el Visor del portal de administración.
- Descripción del modificador [Columna F]
- Es el nombre que se verá en el Visor del portal de administración.
- Orden [Columna H]
- Define la posición en que se mostrarán los modificadores dentro de su grupo.
- Agregador [Columnas I-L]
- Define el agregador al que se publicarán estos cambios; en este caso señalizar la columna correspondiente para el agregador según se requiera.

**Resultado esperado:**
A.El archivo permite el registro de los valores necesarios para habilitar los ítems y el ingreso del nombre de la categoría, orden y agregadores.
B.En la pestaña Vigencias, los horarios de la tienda deben estar dentro del rango 07:00 a 23:50 o, en su defecto, todos los horarios deben registrarse como 00:00.

---

### Caso de prueba: CP3
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 4
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Cargar filtros para un nuevo menú.

**Descripcion:**
- Validar la carga de filtros en el portal de administración para Starbucks y el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Starbucks
- Sucursal base: 38109 (WTC)
- Tipo de menú: Delivery
- Sucursal hija: 38119 (Lomas Verdes)
- Tipo menú: Delivery BIS
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la información/notas según lo requiera.

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Carga de filtros.
2. Establecer los siguientes valores en la carga de filtros:
- País: México
- Marca: Starbucks
- Sucursal base: 38109 (WTC)
- Tipo de menú: Delivery
- Sucursal hija: 38119 (Lomas Verdes)
- Tipo menú: Delivery BIS
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la información/notas según lo requiera.
3. Adjuntar plantilla que ha sido modificada por el usuario y hacer clic en "Cargar filtros".

**Resultado esperado:**
- El portal muestra un mensaje de éxito por el envío al correo de la carga de filtros y envía un correo con el resumen de la información cargada.

---

### Caso de prueba: CP4
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 5
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Verificar que el portal permita la carga exitosa de un nuevo menú para Starbucks en el agregador seleccionado.

**Descripcion:**
- Verificar que el portal permita la carga exitosa de un nuevo menú para Starbucks en el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Starbucks
- Sucursal: 38109
- Agregador: Uber Eats / DiDi / Rappi / MOP.
- Tipo de menú: Delivery

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Cargar menú.
2. Configurar los filtros con la información correspondiente:
- País: México
- Marca: Starbucks
- Sucursal: 38109
- Agregador: Uber Eats / DiDi / Rappi / MOP.
- Tipo de menú: Delivery
3. Ingresar una descripción para la carga y hacer clic en "Cargar menú".

**Resultado esperado:**
- El portal muestra mensaje de éxito correspondiente a la carga final del menú y envía un correo con el resumen de la carga realizada.

---

### Caso de prueba: CP5
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 6
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Starbucks en el agregador seleccioando.

**Descripcion:**
- Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Starbucks en el agregador seleccioando.

**Precondiciones:**
A. La plantilla utilizada para la carga del menú ha sido editada y guardada con los valores requeridos.
B. Los filtros de país, marca, sucursal y agregador están correctamente configurados en el Visor CORE.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Ingresar a Menú > "Visor CORE".
2. Seleccionar Marca: Starbucks, Agregador: Uber Eats, Sucursal: 38109.
3. Buscar la categoría y el producto registrado en la plantilla.
4. Revisar el orden en que se muestran los grupos modificadores y sus modificadores dentro del ítem.
5. Comparar ese orden contra el valor definido en la columna "Orden" de la plantilla cargada.

**Resultado esperado:**
- Se visualiza la categoría y el ítem con la información exacta registrada en la plantilla (Nombre comercial y descripción).
- El orden en que se despliegan los grupos modificadores y modificadores en el Visor CORE coincide exactamente con el orden definido en la columna "Orden" de la plantilla cargada.

---

### Caso de prueba: CP6
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 7
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Validar el JSON del menú publicado.

**Descripcion:**
- Comprobar que el JSON generado para Starbucks en el agregador seleccionado refleja los grupos modificadores y modificadores en el orden correcto.

**Precondiciones:**
- El menú ha sido cargado y validado en el Visor CORE para esta marca y agregador.

**Datos:**
- Marca: Starbucks
- Agregador: Uber Eats / DiDi / Rappi / MOP.
- Sucursal: 38109.

**Pasos:**
1. Ingresar a la opción del portal donde se consulta/descarga el JSON del menú publicado (Menú > Visor CORE > Ver JSON, o la opción equivalente).
2. Seleccionar los siguiemntes datos:
- Marca: Starbucks
- Agregador: Uber Eats / DiDi / Rappi / MOP.
- Sucursal: 38109.
3. Obtener el JSON correspondiente al ítem y categoría registrados en la plantilla.
4. Ubicar dentro del JSON el nodo de grupos modificadores ("modifierGroups" o equivalente) y sus modificadores.
5. Verificar el campo de orden/posición de cada grupo modificador y modificador dentro del JSON.

**Resultado esperado:**
- El JSON generado refleja el mismo orden de grupos modificadores y modificadores que el definido en la columna "Orden" de la plantilla cargada, sin inconsistencias respecto a lo mostrado en el Visor CORE.

---

### Caso de prueba: CP7
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 8
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente grupos modificadores.

**Descripcion:**
- Validar que el campo Orden de la pestaña Grupo Modificador permita cambiar la posición de los grupos sin modificar el orden de los modificadores asociados.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. La plantilla debe contener un producto con al menos 3 grupos modificadores.
C. Cada grupo debe contar con al menos un modificador asociado.
D. Identificar el orden original de los grupos y modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña GrupoModificador.
2. Localizar el producto a validar.
3. Identificar los grupos modificadores y el valor actual de la columna Orden.
4. Modificar únicamente el campo Orden de los grupos modificadores.
5. Por ejemplo, cambiar el orden de los grupos en la plantilla.
6. No modificar los valores de Orden correspondientes a los modificadores.
7. Guardar la plantilla.
8. Realizar la carga correspondiente.
9. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.Los grupos modificadores se muestran en Visor CORE en el nuevo orden definido en la plantilla.
B.Los modificadores asociados a cada grupo conservan el orden previamente establecido.
C.El cambio de orden del grupo no modifica el orden interno de sus modificadores.

---

### Caso de prueba: CP8
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 9
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente modificadores dentro de un grupo.

**Descripcion:**
- Validar que el campo Orden de la pestaña Modificadores permita modificar la posición de los modificadores sin alterar la posición del grupo modificador.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. Existir un producto con un grupo modificador que contenga al menos 3 modificadores.
C. Identificar el orden original del grupo y de sus modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña Modificadores.
2. Localizar el producto y el grupo modificador correspondiente.
3. Identificar los modificadores asociados y su valor actual en la columna Orden.
4. Modificar únicamente el orden de los modificadores.
5. Mantener sin cambios el orden del grupo modificador.
6. Guardar la plantilla y realizar la carga.
7. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.El grupo modificador conserva su posición.
B.Los modificadores se muestran dentro del grupo en el orden definido en la plantilla.
C.Ningún otro grupo modificador cambia de posición como consecuencia de la modificación.

---

### Caso de prueba: CP9
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 10
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar simultáneamente grupos modificadores y modificadores.

**Descripcion:**
- Validar que ambos niveles de ordenamiento puedan modificarse en una misma plantilla y que los cambios se reflejen correctamente.

**Precondiciones:**
A. Contar con un producto asociado a múltiples grupos modificadores.
B. Cada grupo debe contener múltiples modificadores.
C. Contar con plantilla editable y permisos para realizar la carga.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla.
2. En la pestaña GrupoModificador, modificar el campo Orden de los grupos.
3. En la pestaña Modificadores, modificar el campo Orden de los modificadores asociados.
4. Guardar la plantilla.
5. Realizar la carga del menú.
6. Consultar el producto en Visor CORE.
7. Validar primero el orden de los grupos.
8. Consultar cada grupo y validar el orden de sus modificadores.

**Resultado esperado:**
A. Los grupos de modificadores se muestran en el orden definido en la plantilla.
B. Los modificadores de cada grupo se muestran en el orden establecido.
C. El orden de los modificadores se mantiene dentro del grupo correspondiente, conforme a lo definido en la plantilla.
D. Los cambios realizados en los grupos de modificadores y en sus modificadores se aplican de forma independiente

---

### Caso de prueba: CP10
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 11
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Modificar el orden de un menú existente.

**Descripcion:**
- Validar que un menú previamente cargado pueda actualizar el orden de grupos modificadores y/o modificadores mediante una nueva carga.

**Precondiciones:**
A. Contar con un menú previamente publicado.
B. El producto debe tener múltiples grupos y modificadores.
C. Conocer el orden actual mostrado en Visor CORE.
D. Contar con una plantilla para realizar la modificación.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE y registrar el orden actual.
2. Abrir la plantilla del menú existente.
3. Modificar el orden de uno o más grupos modificadores.
4. Modificar el orden de uno o más modificadores.
5. Guardar la plantilla.
6. Realizar la carga del menú existente utilizando el mecanismo de actualización/versionamiento correspondiente.
7. Esperar la finalización del proceso.
8. Consultar nuevamente el producto en Visor CORE.

**Resultado esperado:**
A. El menú existente se actualiza conforme a los cambios realizados.
B. Los grupos y modificadores actualizados reflejan la nueva posición definida.
C. La información que no fue modificada permanece sin cambios.
D. No se generan duplicados de grupos ni modificadores.

---

### Caso de prueba: CP11
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 12
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Media
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Menú sin cambios en el orden conserve su posición original.

**Descripcion:**
- Validar que volver a cargar una plantilla con los mismos valores de orden no provoque reordenamientos.

**Precondiciones:**
A. Contar con un menú publicado.
B. Identificar el orden actual de los grupos y modificadores.
C. Contar con la plantilla con los mismos valores de orden originales.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE.
2. Validar el orden de cada grupo modificador.
3. Consultar el orden de los modificadores de cada grupo.
4. Abrir la plantilla.
5. Mantener sin cambios los valores de la columna Orden.
6. Cambiar el nombre de un  producto para identificación de la publicación del nuevo menú.
7. Guardar y cargar nuevamente la plantilla.
8. Consultar nuevamente el producto en Visor CORE.
9. Comparar la posición antes y después de la carga.

**Resultado esperado:**
A. Los grupos de modificadores mantienen la posición definida originalmente en la plantilla.
B. Los modificadores conservan su posición dentro de cada grupo, conforme a lo establecido en la plantilla.
C. El orden de los grupos y modificadores cambia únicamente cuando se especifica un nuevo valor en la columna “Orden” de la plantilla.
D. La actualización puede identificarse mediante el cambio de nombre del ítem realizado en el paso 6 de la sección “Pasos a ejecutar”.

---

### Caso de prueba: CP12
- Implementado: No
- Hoja origen: `SBX`
- Fila origen Excel: 13
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenamiento con múltiples grupos y modificadores.

**Descripcion:**
- Consultar que un item contenga más de tres grupos modificadores que contengan multiples modificadores,  para validar que el ordenamiento se mantenga tal como se establece en la plantilla.

**Precondiciones:**
A. Contar con un producto que tenga más de tres grupos de modificadores.
B. Cada grupo deberá contener al menos tres modificadores.
C. Identificar el orden inicial de los grupos y sus respectivos modificadores.
D. Contar con acceso al Visor CORE para consultar el ordenamiento de los ítems.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y localizar el ítem a modificar.
2. Consultar el orden inicial de los grupos de modificadores.
3. Consultar el orden inicial de los modificadores dentro de cada grupo.
4. Editar el orden de los grupos de modificadores.
5. Editar el orden de varios modificadores dentro de los grupos seleccionados.
6. Mantener sin cambios algunos grupos y modificadores.
7. Guardar la plantilla.
8. Realizar la carga de la plantilla.
9. Consultar el producto en Visor CORE.
10. Validar que los grupos de modificadores se encuentren en el orden definido en la plantilla.
11. Validar que los modificadores de cada grupo se encuentren en el orden definido en la plantilla.
12. Verificar que los grupos y modificadores que no fueron modificados conserven su orden original.

**Resultado esperado:**
A.Todos los grupos se muestran en el orden establecido en la plantilla.
- B Los modificadores de cada grupo se muestran en el orden definido en la plantilla.
C.Los grupos y modificadores que no fueron modificados conservan su posición original.
D.No se presentan duplicados, pérdida de registros ni asignación incorrecta de modificadores entre grupos.
E.La información visualizada en Visor CORE coincide con la configuración establecida en la plantilla.

---

---

## Escenario: OrdenamientoGpoMod&Mod 2.0 - Burger King
**Descripcion:** Validar el flujo funcional de descarga, edicion, carga, publicacion y verificacion de ordenamiento de grupos modificadores y modificadores para Burger King.

**Modulo/Bloque:** Menú > Administración / Visor CORE
**Hoja origen:** `BK`
**Casos incluidos:** 12
**Etiquetas sugeridas:** `@catalogo` `@menu` `@administracion` `@visor-core` `@ordenamiento-gpo-mod` `@burger-king`

### Caso de prueba: CP13
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 2
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Descarga de plantilla para registro de filtros.

**Descripcion:**
- Validar que el envío y la descarga de la plantilla para registrar filtros se realice correctamente y que el archivo se reciba en el correo del usuario.

**Precondiciones:**
- Disponer de credenciales de acceso vigentes que permitan una autenticación exitosa en el portal de administración de Alsea:
- https://dev.admin.delivery.alsea.net/login/

**Datos:**
- País: México
- Marca: Burguer King
- Sucursal base: 7097 (Minerva)
- Tipo de menú: Delivery
- Sucursal hija: 22780 (Portal San Ángel)
- Tipo menú: Delivery

**Pasos:**
1. Ingresar a Menú y elegir la opción "Administración".
2. Dar clic en "Descargar plantilla".
3. Ingresar la siguiente información de la plantilla:
- País: México
- Marca: Burguer King
- Sucursal base: 7097 (Minerva)
- Tipo de menú: Delivery
- Sucursal hija: 22780 (Portal San Ángel)
- Tipo menú: Delivery
4. Seleccionar fecha (la selección de fecha es opcional)
5. Dar clic en botón "Descargar plantilla".

**Resultado esperado:**
- El portal de administración muestra mensaje de confirmación y envía la plantilla en formato Excel al correo electrónico del usuario.

---

### Caso de prueba: CP14
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 3
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Edición de plantilla.

**Descripcion:**
- Validar que en la plantilla el usuario personalice los datos de "Grupo modificador" y "Modificadores" para Burger King, específicamente los campos Nombre comercial, Descripción y Orden, para publicar en el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido descargada correctamente y se encuentra disponible para su edición.

**Datos:**
- Nombre comercial del modificador [Columna E]
- Descripción del modificador [Columna F]
- Orden [Columna H]
- Agregador [Columnas I-L]

**Pasos:**
1. Abrir la plantilla y navegar a la pestaña "Items".
2. Localizar el ID del producto que se va a modificar.
3. Acceder a la pestaña "Grupo modificador" y completar los siguientes campos:
- Nombre comercial del modificador [Columna E]
- Es el nombre que se verá en el Visor del portal de administración.
- Descripción del modificador [Columna F]
- Es el nombre que se verá en el Visor del portal de administración.
- Orden [Columna H]
- Define la posición en que se mostrarán los modificadores dentro de su grupo.
- Agregador [Columnas I-L]
- Define el agregador al que se publicarán estos cambios; en este caso señalizar la columna correspondiente para el agregador Uber Eats / DiDi / Rappi.

**Resultado esperado:**
- El archivo permite el registro de los valores necesarios para habilitar los ítems y el ingreso del nombre de la categoría, orden y agregadores.
- En la pestaña Vigencias, los horarios de la tienda deben estar dentro del rango 07:00 a 23:50 o, en su defecto, todos los horarios deben registrarse como 00:00.

---

### Caso de prueba: CP15
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 4
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Cargar filtros para un nuevo menú.

**Descripcion:**
- Validar la carga de filtros en el portal de administración para Burger King y el agregador Uber Eats.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- Países: México
- Marcas: Burger King
- Agregadores: Uber Eats / DiDi / Rappi
- Sucursales: 7097
- Tipo de menú: Delivery
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Carga de filtros.
2. Establecer los siguientes valores en la carga de filtros:
- Países: México
- Marcas: Burger King
- Agregadores: Uber Eats / DiDi / Rappi
- Sucursales: 7097
- Tipo de menú: Delivery
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.
3. Adjuntar plantilla que ha sido modificada por el usuario y hacer clic en "Cargar filtros".

**Resultado esperado:**
- El portal muestra un mensaje de éxito por el envío al correo de la carga de filtros y envía un correo con el resumen de la información cargada.

---

### Caso de prueba: CP16
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 5
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Verificar que el portal permita la carga exitosa de un nuevo menú para Burger King en el agregador seleccionado.

**Descripcion:**
- Verificar que el portal permita la carga exitosa de un nuevo menú para Burger King en el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Burger King
- Sucursal: 7097
- Agregador: Uber Eats / DiDi / Rappi
- Tipo de menú: Delivery

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Cargar menú.
2. Configurar los filtros con la información correspondiente:
- País: México
- Marca: Burger King
- Sucursal: 7097
- Agregador: Uber Eats / DiDi / Rappi
- Tipo de menú: Delivery
3. Ingresar una descripción para la carga y hacer clic en "Cargar menú".

**Resultado esperado:**
- El portal muestra mensaje de éxito correspondiente a la carga final del menú y envía un correo con el resumen de la carga realizada.

---

### Caso de prueba: CP17
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 6
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Burger King en el agregador seleccionado.

**Descripcion:**
- Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Burger King en el agregador seleccionado.

**Precondiciones:**
A. La plantilla utilizada para la carga del menú ha sido editada y guardada con los valores requeridos.
B. Los filtros de país, marca, sucursal y agregador están correctamente configurados en el Visor CORE.

**Datos:**
- Marca: Burger King
- Agregador: Uber Eats / DiDi / Rappi
- Sucursal: 7097.

**Pasos:**
1. Ingresar a Menú > "Visor CORE".
2. Seleccionar los siguimetes datos:
- Marca: Burger King
- Agregador: Uber Eats / DiDi / Rappi
- Sucursal: 7097.
3. Buscar la categoría y el producto registrado en la plantilla.
4. Revisar el orden en que se muestran los grupos modificadores y sus modificadores dentro del ítem.
5. Comparar ese orden contra el valor definido en la columna "Orden" de la plantilla cargada.

**Resultado esperado:**
- Se visualiza la categoría y el ítem con la información exacta registrada en la plantilla (Nombre comercial y descripción).
- El orden en que se despliegan los grupos modificadores y modificadores en el Visor CORE coincide exactamente con el orden definido en la columna "Orden" de la plantilla cargada.

---

### Caso de prueba: CP18
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 7
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Validar el JSON del menú publicado.

**Descripcion:**
- Comprobar que el JSON generado para Burger King en Uber Eats refleja los grupos modificadores y modificadores en el orden correcto.

**Precondiciones:**
- El menú ha sido cargado y validado correctamente en el Visor CORE para marca burguer king y agregador seleccionado.

**Datos:**
- Marca: Burger King
- Agregador: Uber Eats / DiDi / Rappi
- Sucursal: 7097

**Pasos:**
1. Ingresar a la opción del portal donde se consulta/descarga el JSON del menú publicado (Menú > Visor CORE > Ver JSON, o la opción equivalente).
2. Seleccionar los siguientes datos:
- Marca: Burger King
- Agregador: Uber Eats / DiDi / Rappi
- Sucursal: 7097
3. Obtener el JSON correspondiente al ítem y categoría registrados en la plantilla.
4. Ubicar dentro del JSON el nodo de grupos modificadores ("modifierGroups" o equivalente) y sus modificadores.
5. Verificar el campo de orden/posición de cada grupo modificador y modificador dentro del JSON.

**Resultado esperado:**
- El JSON generado refleja el mismo orden de grupos modificadores y modificadores que el definido en la columna "Orden" de la plantilla cargada, sin inconsistencias respecto a lo mostrado en el Visor CORE.

---

### Caso de prueba: CP19
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 8
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente grupos modificadores.

**Descripcion:**
- Validar que el campo Orden de la pestaña Grupo Modificador permita cambiar la posición de los grupos sin modificar el orden de los modificadores asociados.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. La plantilla debe contener un producto con al menos 3 grupos modificadores.
C. Cada grupo debe contar con al menos un modificador asociado.
D. Identificar el orden original de los grupos y modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña GrupoModificador.
2. Localizar el producto a validar.
3. Identificar los grupos modificadores y el valor actual de la columna Orden.
4. Modificar únicamente el campo Orden de los grupos modificadores.
5. Por ejemplo, cambiar el orden de los grupos en la plantilla.
6. No modificar los valores de Orden correspondientes a los modificadores.
7. Guardar la plantilla.
8. Realizar la carga correspondiente.
9. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.Los grupos modificadores se muestran en Visor CORE en el nuevo orden definido en la plantilla.
B.Los modificadores asociados a cada grupo conservan el orden previamente establecido.
C.El cambio de orden del grupo no modifica el orden interno de sus modificadores.

---

### Caso de prueba: CP20
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 9
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente modificadores dentro de un grupo.

**Descripcion:**
- Validar que el campo Orden de la pestaña Modificadores permita modificar la posición de los modificadores sin alterar la posición del grupo modificador.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. Existir un producto con un grupo modificador que contenga al menos 3 modificadores.
C. Identificar el orden original del grupo y de sus modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña Modificadores.
2. Localizar el producto y el grupo modificador correspondiente.
3. Identificar los modificadores asociados y su valor actual en la columna Orden.
4. Modificar únicamente el orden de los modificadores.
5. Mantener sin cambios el orden del grupo modificador.
6. Guardar la plantilla y realizar la carga.
7. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.El grupo modificador conserva su posición.
B.Los modificadores se muestran dentro del grupo en el orden definido en la plantilla.
C.Ningún otro grupo modificador cambia de posición como consecuencia de la modificación.

---

### Caso de prueba: CP21
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 10
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar simultáneamente grupos modificadores y modificadores.

**Descripcion:**
- Validar que ambos niveles de ordenamiento puedan modificarse en una misma plantilla y que los cambios se reflejen correctamente.

**Precondiciones:**
A. Contar con un producto asociado a múltiples grupos modificadores.
B. Cada grupo debe contener múltiples modificadores.
C. Contar con plantilla editable y permisos para realizar la carga.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla.
2. En la pestaña GrupoModificador, modificar el campo Orden de los grupos.
3. En la pestaña Modificadores, modificar el campo Orden de los modificadores asociados.
4. Guardar la plantilla.
5. Realizar la carga del menú.
6. Consultar el producto en Visor CORE.
7. Validar primero el orden de los grupos.
8. Consultar cada grupo y validar el orden de sus modificadores.

**Resultado esperado:**
A. Los grupos de modificadores se muestran en el orden definido en la plantilla.
B. Los modificadores de cada grupo se muestran en el orden establecido.
C. El orden de los modificadores se mantiene dentro del grupo correspondiente, conforme a lo definido en la plantilla.
D. Los cambios realizados en los grupos de modificadores y en sus modificadores se aplican de forma independiente

---

### Caso de prueba: CP22
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 11
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Modificar el orden de un menú existente.

**Descripcion:**
- Validar que un menú previamente cargado pueda actualizar el orden de grupos modificadores y/o modificadores mediante una nueva carga.

**Precondiciones:**
A. Contar con un menú previamente publicado.
B. El producto debe tener múltiples grupos y modificadores.
C. Conocer el orden actual mostrado en Visor CORE.
D. Contar con una plantilla para realizar la modificación.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE y registrar el orden actual.
2. Abrir la plantilla del menú existente.
3. Modificar el orden de uno o más grupos modificadores.
4. Modificar el orden de uno o más modificadores.
5. Guardar la plantilla.
6. Realizar la carga del menú existente utilizando el mecanismo de actualización/versionamiento correspondiente.
7. Esperar la finalización del proceso.
8. Consultar nuevamente el producto en Visor CORE.

**Resultado esperado:**
A. El menú existente se actualiza conforme a los cambios realizados.
B. Los grupos y modificadores actualizados reflejan la nueva posición definida.
C. La información que no fue modificada permanece sin cambios.
D. No se generan duplicados de grupos ni modificadores.

---

### Caso de prueba: CP23
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 12
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Media
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Menú sin cambios en el orden conserve su posición original.

**Descripcion:**
- Validar que volver a cargar una plantilla con los mismos valores de orden no provoque reordenamientos.

**Precondiciones:**
A. Contar con un menú publicado.
B. Identificar el orden actual de los grupos y modificadores.
C. Contar con la plantilla con los mismos valores de orden originales.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE.
2. Validar el orden de cada grupo modificador.
3. Consultar el orden de los modificadores de cada grupo.
4. Abrir la plantilla.
5. Mantener sin cambios los valores de la columna Orden.
6. Cambiar el nombre de un  producto para identificación de la publicación del nuevo menú.
7. Guardar y cargar nuevamente la plantilla.
8. Consultar nuevamente el producto en Visor CORE.
9. Comparar la posición antes y después de la carga.

**Resultado esperado:**
A. Los grupos de modificadores mantienen la posición definida originalmente en la plantilla.
B. Los modificadores conservan su posición dentro de cada grupo, conforme a lo establecido en la plantilla.
C. El orden de los grupos y modificadores cambia únicamente cuando se especifica un nuevo valor en la columna “Orden” de la plantilla.
D. La actualización puede identificarse mediante el cambio de nombre del ítem realizado en el paso 6 de la sección “Pasos a ejecutar”.

---

### Caso de prueba: CP24
- Implementado: No
- Hoja origen: `BK`
- Fila origen Excel: 13
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenamiento con múltiples grupos y modificadores.

**Descripcion:**
- Consultar que un item contenga más de tres grupos modificadores que contengan multiples modificadores,  para validar que el ordenamiento se mantenga tal como se establece en la plantilla.

**Precondiciones:**
A. Contar con un producto que tenga más de tres grupos de modificadores.
B. Cada grupo deberá contener al menos tres modificadores.
C. Identificar el orden inicial de los grupos y sus respectivos modificadores.
D. Contar con acceso al Visor CORE para consultar el ordenamiento de los ítems.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y localizar el ítem a modificar.
2. Consultar el orden inicial de los grupos de modificadores.
3. Consultar el orden inicial de los modificadores dentro de cada grupo.
4. Editar el orden de los grupos de modificadores.
5. Editar el orden de varios modificadores dentro de los grupos seleccionados.
6. Mantener sin cambios algunos grupos y modificadores.
7. Guardar la plantilla.
8. Realizar la carga de la plantilla.
9. Consultar el producto en Visor CORE.
10. Validar que los grupos de modificadores se encuentren en el orden definido en la plantilla.
11. Validar que los modificadores de cada grupo se encuentren en el orden definido en la plantilla.
12. Verificar que los grupos y modificadores que no fueron modificados conserven su orden original.

**Resultado esperado:**
A.Todos los grupos se muestran en el orden establecido en la plantilla.
- B Los modificadores de cada grupo se muestran en el orden definido en la plantilla.
C.Los grupos y modificadores que no fueron modificados conservan su posición original.
D.No se presentan duplicados, pérdida de registros ni asignación incorrecta de modificadores entre grupos.
E.La información visualizada en Visor CORE coincide con la configuración establecida en la plantilla.

---

---

## Escenario: OrdenamientoGpoMod&Mod 2.0 - VIPS
**Descripcion:** Validar el flujo funcional de descarga, edicion, carga, publicacion y verificacion de ordenamiento de grupos modificadores y modificadores para VIPS.

**Modulo/Bloque:** Menú > Administración / Visor CORE
**Hoja origen:** `VIPS`
**Casos incluidos:** 12
**Etiquetas sugeridas:** `@catalogo` `@menu` `@administracion` `@visor-core` `@ordenamiento-gpo-mod` `@vips`

### Caso de prueba: CP25
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 2
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Descarga de plantilla para registro de filtros.

**Descripcion:**
- Validar que el envío y la descarga de la plantilla para registrar filtros se realice correctamente y que el archivo se reciba en el correo del usuario.

**Precondiciones:**
- Disponer de credenciales de acceso vigentes que permitan una autenticación exitosa en el portal de administración de Alsea:
- https://dev.admin.delivery.alsea.net/login/

**Datos:**
- Países: México
- Marcas: Vips
- Sucursales: 7097
- Tipo de menú: Delivery

**Pasos:**
1. Ingresar a Menú y elegir la opción "Administración".
2. Dar clic en "Descargar plantilla".
3. Ingresar la siguiente información de la plantilla:
- Países: México
- Marcas: Vips
- Sucursales: 7097
- Tipo de menú: Delivery
4. Seleccionar fecha (la selección de fecha es opcional)
5. Dar clic en botón "Descargar plantilla".

**Resultado esperado:**
- El portal de administración muestra mensaje de confirmación y envía la plantilla en formato Excel al correo electrónico del usuario.

---

### Caso de prueba: CP26
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 3
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Edición de plantilla.

**Descripcion:**
- Validar que en la plantilla el usuario personalice los datos de "Grupo modificador" y "Modificadores" para Vips, específicamente los campos Nombre comercial, Descripción y Orden, para publicar en el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido descargada correctamente y se encuentra disponible para su edición.

**Datos:**
- Nombre comercial del modificador [Columna E]
- Descripción del modificador [Columna F]
- Orden [Columna H]
- Agregador [Columnas I-L]

**Pasos:**
1. Abrir la plantilla y navegar a la pestaña "Items".
2. Localizar el ID del producto que se va a modificar.
3. Acceder a la pestaña "Grupo modificador" y completar los siguientes campos:
- Nombre comercial del modificador [Columna E]
- Es el nombre que se verá en el Visor del portal de administración.
- Descripción del modificador [Columna F]
- Es el nombre que se verá en el Visor del portal de administración.
- Orden [Columna H]
- Define la posición en que se mostrarán los modificadores dentro de su grupo.
- Agregador [Columnas I-L]
- Define el agregador al que se publicarán estos cambios; en este caso señalizar la columna correspondiente para el agregador seleccionado:Uber Eats / DiDi / Rappi / Alsea.

**Resultado esperado:**
- El archivo permite el registro de los valores necesarios para habilitar los ítems y el ingreso del nombre de la categoría, orden y agregadores.
- En la pestaña Vigencias, los horarios de la tienda deben estar dentro del rango 07:00 a 23:50 o, en su defecto, todos los horarios deben registrarse como 00:00.

---

### Caso de prueba: CP27
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 4
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Cargar filtros para un nuevo menú.

**Descripcion:**
- Validar la carga de filtros en el portal de administración para Vips y el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marcas: Vips
- Agregadores: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base:81143 (Parque bosques)
- Tipo de menú: Delivery
- Sucursal hija: 81307 (Las antenas)
- Tipo menú: Delivery Codisys
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Carga de filtros.
2. Establecer los siguientes valores en la carga de filtros:
- País: México
- Marcas: Vips
- Agregadores: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base:81143 (Parque bosques)
- Tipo de menú: Delivery
- Sucursal hija: 81307 (Las antenas)
- Tipo menú: Delivery Codisys
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.
3. Adjuntar plantilla que ha sido modificada por el usuario y hacer clic en "Cargar filtros".

**Resultado esperado:**
- El portal muestra un mensaje de éxito por el envío al correo de la carga de filtros y envía un correo con el resumen de la información cargada.

---

### Caso de prueba: CP28
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 5
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Verificar que el portal permita la carga exitosa de un nuevo menú para Vips en Uber Eats.

**Descripcion:**
- Verificar que el portal permita la carga exitosa de un nuevo menú para Vips en Uber Eats.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Vips
- Sucursal: 7097
- Agregador: Uber Eats
- Tipo de menú: Delivery

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Cargar menú.
2. Configurar los filtros con la información correspondiente:
- País: México
- Marca: Vips
- Sucursal: 7097
- Agregador: Uber Eats
- Tipo de menú: Delivery
3. Ingresar una descripción para la carga y hacer clic en "Cargar menú".

**Resultado esperado:**
- El portal muestra mensaje de éxito correspondiente a la carga final del menú y envía un correo con el resumen de la carga realizada.

---

### Caso de prueba: CP29
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 6
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Vips y el agregador seleccionado.

**Descripcion:**
- Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Vips y el agregador seleccionado.

**Precondiciones:**
A. La plantilla utilizada para la carga del menú ha sido editada y guardada con los valores requeridos.
B. Los filtros de país, marca, sucursal y agregador están correctamente configurados en el Visor CORE.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Ingresar a Menú > "Visor CORE".
2. Seleccionar Marca: VipsAgregador: Uber Eats, Sucursal: 7097.
3. Buscar la categoría y el producto registrado en la plantilla.
4. Revisar el orden en que se muestran los grupos modificadores y sus modificadores dentro del ítem.
5. Comparar ese orden contra el valor definido en la columna "Orden" de la plantilla cargada.

**Resultado esperado:**
- Se visualiza la categoría y el ítem con la información exacta registrada en la plantilla (Nombre comercial y descripción).
- El orden en que se despliegan los grupos modificadores y modificadores en el Visor CORE coincide exactamente con el orden definido en la columna "Orden" de la plantilla cargada.

---

### Caso de prueba: CP30
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 7
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Validar el JSON del menú publicado.

**Descripcion:**
- Comprobar que el JSON generado para Vips en Uber Eats refleja los grupos modificadores y modificadores en el orden correcto.

**Precondiciones:**
- El menú ha sido cargado y validado correctamente en el Visor CORE para esta marca y agregador.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Ingresar a la opción del portal donde se consulta/descarga el JSON del menú publicado (Menú > Visor CORE > Ver JSON, o la opción equivalente).
2. Seleccionar Marca: Vips, Agregador: Uber Eats, Sucursal: 7097.
3. Obtener el JSON correspondiente al ítem y categoría registrados en la plantilla.
4. Ubicar dentro del JSON el nodo de grupos modificadores ("modifierGroups" o equivalente) y sus modificadores.
5. Verificar el campo de orden/posición de cada grupo modificador y modificador dentro del JSON.

**Resultado esperado:**
- El JSON generado refleja el mismo orden de grupos modificadores y modificadores que el definido en la columna "Orden" de la plantilla cargada, sin inconsistencias respecto a lo mostrado en el Visor CORE.

---

### Caso de prueba: CP31
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 8
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente grupos modificadores.

**Descripcion:**
- Validar que el campo Orden de la pestaña Grupo Modificador permita cambiar la posición de los grupos sin modificar el orden de los modificadores asociados.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. La plantilla debe contener un producto con al menos 3 grupos modificadores.
C. Cada grupo debe contar con al menos un modificador asociado.
D. Identificar el orden original de los grupos y modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña GrupoModificador.
2. Localizar el producto a validar.
3. Identificar los grupos modificadores y el valor actual de la columna Orden.
4. Modificar únicamente el campo Orden de los grupos modificadores.
5. Por ejemplo, cambiar el orden de los grupos en la plantilla.
6. No modificar los valores de Orden correspondientes a los modificadores.
7. Guardar la plantilla.
8. Realizar la carga correspondiente.
9. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.Los grupos modificadores se muestran en Visor CORE en el nuevo orden definido en la plantilla.
B.Los modificadores asociados a cada grupo conservan el orden previamente establecido.
C.El cambio de orden del grupo no modifica el orden interno de sus modificadores.

---

### Caso de prueba: CP32
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 9
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente modificadores dentro de un grupo.

**Descripcion:**
- Validar que el campo Orden de la pestaña Modificadores permita modificar la posición de los modificadores sin alterar la posición del grupo modificador.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. Existir un producto con un grupo modificador que contenga al menos 3 modificadores.
C. Identificar el orden original del grupo y de sus modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña Modificadores.
2. Localizar el producto y el grupo modificador correspondiente.
3. Identificar los modificadores asociados y su valor actual en la columna Orden.
4. Modificar únicamente el orden de los modificadores.
5. Mantener sin cambios el orden del grupo modificador.
6. Guardar la plantilla y realizar la carga.
7. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.El grupo modificador conserva su posición.
B.Los modificadores se muestran dentro del grupo en el orden definido en la plantilla.
C.Ningún otro grupo modificador cambia de posición como consecuencia de la modificación.

---

### Caso de prueba: CP33
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 10
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar simultáneamente grupos modificadores y modificadores.

**Descripcion:**
- Validar que ambos niveles de ordenamiento puedan modificarse en una misma plantilla y que los cambios se reflejen correctamente.

**Precondiciones:**
A. Contar con un producto asociado a múltiples grupos modificadores.
B. Cada grupo debe contener múltiples modificadores.
C. Contar con plantilla editable y permisos para realizar la carga.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla.
2. En la pestaña GrupoModificador, modificar el campo Orden de los grupos.
3. En la pestaña Modificadores, modificar el campo Orden de los modificadores asociados.
4. Guardar la plantilla.
5. Realizar la carga del menú.
6. Consultar el producto en Visor CORE.
7. Validar primero el orden de los grupos.
8. Consultar cada grupo y validar el orden de sus modificadores.

**Resultado esperado:**
A. Los grupos de modificadores se muestran en el orden definido en la plantilla.
B. Los modificadores de cada grupo se muestran en el orden establecido.
C. El orden de los modificadores se mantiene dentro del grupo correspondiente, conforme a lo definido en la plantilla.
D. Los cambios realizados en los grupos de modificadores y en sus modificadores se aplican de forma independiente

---

### Caso de prueba: CP34
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 11
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Modificar el orden de un menú existente.

**Descripcion:**
- Validar que un menú previamente cargado pueda actualizar el orden de grupos modificadores y/o modificadores mediante una nueva carga.

**Precondiciones:**
A. Contar con un menú previamente publicado.
B. El producto debe tener múltiples grupos y modificadores.
C. Conocer el orden actual mostrado en Visor CORE.
D. Contar con una plantilla para realizar la modificación.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE y registrar el orden actual.
2. Abrir la plantilla del menú existente.
3. Modificar el orden de uno o más grupos modificadores.
4. Modificar el orden de uno o más modificadores.
5. Guardar la plantilla.
6. Realizar la carga del menú existente utilizando el mecanismo de actualización/versionamiento correspondiente.
7. Esperar la finalización del proceso.
8. Consultar nuevamente el producto en Visor CORE.

**Resultado esperado:**
A. El menú existente se actualiza conforme a los cambios realizados.
B. Los grupos y modificadores actualizados reflejan la nueva posición definida.
C. La información que no fue modificada permanece sin cambios.
D. No se generan duplicados de grupos ni modificadores.

---

### Caso de prueba: CP35
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 12
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Media
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Menú sin cambios en el orden conserve su posición original.

**Descripcion:**
- Validar que volver a cargar una plantilla con los mismos valores de orden no provoque reordenamientos.

**Precondiciones:**
A. Contar con un menú publicado.
B. Identificar el orden actual de los grupos y modificadores.
C. Contar con la plantilla con los mismos valores de orden originales.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE.
2. Validar el orden de cada grupo modificador.
3. Consultar el orden de los modificadores de cada grupo.
4. Abrir la plantilla.
5. Mantener sin cambios los valores de la columna Orden.
6. Cambiar el nombre de un  producto para identificación de la publicación del nuevo menú.
7. Guardar y cargar nuevamente la plantilla.
8. Consultar nuevamente el producto en Visor CORE.
9. Comparar la posición antes y después de la carga.

**Resultado esperado:**
A. Los grupos de modificadores mantienen la posición definida originalmente en la plantilla.
B. Los modificadores conservan su posición dentro de cada grupo, conforme a lo establecido en la plantilla.
C. El orden de los grupos y modificadores cambia únicamente cuando se especifica un nuevo valor en la columna “Orden” de la plantilla.
D. La actualización puede identificarse mediante el cambio de nombre del ítem realizado en el paso 6 de la sección “Pasos a ejecutar”.

---

### Caso de prueba: CP36
- Implementado: No
- Hoja origen: `VIPS`
- Fila origen Excel: 13
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenamiento con múltiples grupos y modificadores.

**Descripcion:**
- Consultar que un item contenga más de tres grupos modificadores que contengan multiples modificadores,  para validar que el ordenamiento se mantenga tal como se establece en la plantilla.

**Precondiciones:**
A. Contar con un producto que tenga más de tres grupos de modificadores.
B. Cada grupo deberá contener al menos tres modificadores.
C. Identificar el orden inicial de los grupos y sus respectivos modificadores.
D. Contar con acceso al Visor CORE para consultar el ordenamiento de los ítems.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y localizar el ítem a modificar.
2. Consultar el orden inicial de los grupos de modificadores.
3. Consultar el orden inicial de los modificadores dentro de cada grupo.
4. Editar el orden de los grupos de modificadores.
5. Editar el orden de varios modificadores dentro de los grupos seleccionados.
6. Mantener sin cambios algunos grupos y modificadores.
7. Guardar la plantilla.
8. Realizar la carga de la plantilla.
9. Consultar el producto en Visor CORE.
10. Validar que los grupos de modificadores se encuentren en el orden definido en la plantilla.
11. Validar que los modificadores de cada grupo se encuentren en el orden definido en la plantilla.
12. Verificar que los grupos y modificadores que no fueron modificados conserven su orden original.

**Resultado esperado:**
A.Todos los grupos se muestran en el orden establecido en la plantilla.
- B Los modificadores de cada grupo se muestran en el orden definido en la plantilla.
C.Los grupos y modificadores que no fueron modificados conservan su posición original.
D.No se presentan duplicados, pérdida de registros ni asignación incorrecta de modificadores entre grupos.
E.La información visualizada en Visor CORE coincide con la configuración establecida en la plantilla.

---

---

## Escenario: OrdenamientoGpoMod&Mod 2.0 - Chili's
**Descripcion:** Validar el flujo funcional de descarga, edicion, carga, publicacion y verificacion de ordenamiento de grupos modificadores y modificadores para Chili's.

**Modulo/Bloque:** Menú > Administración / Visor CORE
**Hoja origen:** `Chili´s`
**Casos incluidos:** 12
**Etiquetas sugeridas:** `@catalogo` `@menu` `@administracion` `@visor-core` `@ordenamiento-gpo-mod` `@chilis`

### Caso de prueba: CP37
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 2
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Descarga de plantilla para registro de filtros.

**Descripcion:**
- Validar que el envío y la descarga de la plantilla para registrar filtros se realice correctamente y que el archivo se reciba en el correo del usuario.

**Precondiciones:**
- Disponer de credenciales de acceso vigentes que permitan una autenticación exitosa en el portal de administración de Alsea:
- https://dev.admin.delivery.alsea.net/login/

**Datos:**
- País: México
- Marca: Chili's
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys

**Pasos:**
1. Ingresar a Menú y elegir la opción "Administración".
2. Dar clic en "Descargar plantilla".
3. Ingresar la siguiente información de la plantilla:
- País: México
- Marca: Chili's
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys
4. Dar clic en botón "Descargar plantilla".

**Resultado esperado:**
- El portal de administración muestra mensaje de confirmación y envía la plantilla en formato Excel al correo electrónico del usuario.

---

### Caso de prueba: CP38
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 3
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Edición de plantilla.

**Descripcion:**
- Validar que en la plantilla el usuario personalice los datos de "Grupo modificador" y "Modificadores" para Chili's, específicamente los campos Nombre comercial, Descripción y Orden, para publicar en el agregador al que se requiera publicar.

**Precondiciones:**
- La plantilla ha sido descargada correctamente y se encuentra disponible para su edición.

**Datos:**
- Nombre comercial del modificador [Columna E]
- Descripción del modificador [Columna F]
- Orden [Columna H]
- Agregador [Columnas I-L]

**Pasos:**
1. Abrir la plantilla y navegar a la pestaña "Items".
2. Localizar el ID del producto que se va a modificar.
3. Acceder a la pestaña "Grupo modificador" y completar los siguientes campos:
- Nombre comercial del modificador [Columna E]
- Es el nombre que se verá en el Visor del portal de administración.
- Descripción del modificador [Columna F]
- Es el nombre que se verá en el Visor del portal de administración.
- Orden [Columna H]
- Define la posición en que se mostrarán los modificadores dentro de su grupo.
- Agregador [Columnas I-L]
- Define el agregador al que se publicarán estos cambios; en este caso señalizar la columna correspondiente para el agregador segun se requiera:Uber Eats / DiDi / Rappi / Alsea.

**Resultado esperado:**
- El archivo permite el registro de los valores necesarios para habilitar los ítems y el ingreso del nombre de la categoría, orden y agregadores.
- En la pestaña Vigencias, los horarios de la tienda deben estar dentro del rango 07:00 a 23:50 o, en su defecto, todos los horarios deben registrarse como 00:00.

---

### Caso de prueba: CP39
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 4
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Cargar filtros para un nuevo menú.

**Descripcion:**
- Validar la carga de filtros en el portal de administración para Chili's y el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Chili's
- Agregadores: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Carga de filtros.
2. Establecer los siguientes valores en la carga de filtros:
- País: México
- Marca: Chili's
- Agregadores: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys
- Tipo de carga: Nuevo menú
- Versionar menú: No
- Ingresa una descripción: Texto donde el usuario debe ingresar la descripción correspondiente a los filtros que está cargando.
3. Adjuntar plantilla que ha sido modificada por el usuario y hacer clic en "Cargar filtros".

**Resultado esperado:**
- El portal muestra un mensaje de éxito por el envío al correo de la carga de filtros y envía un correo con el resumen de la información cargada.

---

### Caso de prueba: CP40
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 5
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Verificar que el portal permita la carga exitosa de un nuevo menú para Chili's en el agregador seleccionado.

**Descripcion:**
- Verificar que el portal permita la carga exitosa de un nuevo menú para Chili's en el agregador seleccionado.

**Precondiciones:**
- La plantilla ha sido editada con los valores requeridos por el usuario y guardada correctamente.

**Datos:**
- País: México
- Marca: Chili's
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys
- Agregador: Uber Eats / DiDi / Rappi / Alsea.

**Pasos:**
1. Acceder a la opción Menú --> Administración --> Cargar menú.
2. Configurar los filtros con la información correspondiente:
- País: México
- Marca: Chili's
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
- Tipo de menú: Delivery Codisys
- Agregador: Uber Eats / DiDi / Rappi / Alsea.
3. Ingresar una descripción para la carga y hacer clic en "Cargar menú".

**Resultado esperado:**
- El portal muestra mensaje de éxito correspondiente a la carga final del menú y envía un correo con el resumen de la carga realizada.

---

### Caso de prueba: CP41
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 6
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Chili's en el agregador seleccionado.

**Descripcion:**
- Comprobar que el menú se visualiza correctamente en el Visor CORE, validando el orden de los grupos modificadores para Chili's en el agregador seleccionado.

**Precondiciones:**
A. La plantilla utilizada para la carga del menú ha sido editada y guardada con los valores requeridos.
B. Los filtros de país, marca, sucursal y agregador están correctamente configurados en el Visor CORE.

**Datos:**
- Marca: Chili's
- Agregador: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)

**Pasos:**
1. Ingresar a Menú > "Visor CORE".
2. Seleccionar los siguinetes datos:
- Marca: Chili's
- Agregador: Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
3. Buscar la categoría y el producto registrado en la plantilla.
4. Revisar el orden en que se muestran los grupos modificadores y sus modificadores dentro del ítem.
5. Comparar ese orden contra el valor definido en la columna "Orden" de la plantilla cargada.

**Resultado esperado:**
- Se visualiza la categoría y el ítem con la información exacta registrada en la plantilla (Nombre comercial y descripción).
- El orden en que se despliegan los grupos modificadores y modificadores en el Visor CORE coincide exactamente con el orden definido en la columna "Orden" de la plantilla cargada.

---

### Caso de prueba: CP42
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 7
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Validar el JSON del menú publicado.

**Descripcion:**
- Comprobar que el JSON generado para Chili's en el agregador refleja los grupos modificadores y modificadores en el orden correcto.

**Precondiciones:**
- El menú ha sido cargado y validado correctamente en el Visor CORE para esta marca y agregador.

**Datos:**
- Marca: Chili's
- Agregador:  Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)

**Pasos:**
1. Ingresar a la opción del portal donde se consulta/descarga el JSON del menú publicado (Menú > Visor CORE > Ver JSON, o la opción equivalente).
2. Seleccionar los siguiemntes datos:
- Marca: Chili's
- Agregador:  Uber Eats / DiDi / Rappi / Alsea.
- Sucursal base: 1075(Aeropuerto T1)
- sucursal hija: 1002 (Universidad)
3. Obtener el JSON correspondiente al ítem y categoría registrados en la plantilla.
4. Ubicar dentro del JSON el nodo de grupos modificadores ("modifierGroups" o equivalente) y sus modificadores.
5. Verificar el campo de orden/posición de cada grupo modificador y modificador dentro del JSON.

**Resultado esperado:**
- El JSON generado refleja el mismo orden de grupos modificadores y modificadores que el definido en la columna "Orden" de la plantilla cargada, sin inconsistencias respecto a lo mostrado en el Visor CORE.

---

### Caso de prueba: CP43
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 8
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente grupos modificadores.

**Descripcion:**
- Validar que el campo Orden de la pestaña Grupo Modificador permita cambiar la posición de los grupos sin modificar el orden de los modificadores asociados.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. La plantilla debe contener un producto con al menos 3 grupos modificadores.
C. Cada grupo debe contar con al menos un modificador asociado.
D. Identificar el orden original de los grupos y modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña GrupoModificador.
2. Localizar el producto a validar.
3. Identificar los grupos modificadores y el valor actual de la columna Orden.
4. Modificar únicamente el campo Orden de los grupos modificadores.
5. Por ejemplo, cambiar el orden de los grupos en la plantilla.
6. No modificar los valores de Orden correspondientes a los modificadores.
7. Guardar la plantilla.
8. Realizar la carga correspondiente.
9. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.Los grupos modificadores se muestran en Visor CORE en el nuevo orden definido en la plantilla.
B.Los modificadores asociados a cada grupo conservan el orden previamente establecido.
C.El cambio de orden del grupo no modifica el orden interno de sus modificadores.

---

### Caso de prueba: CP44
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 9
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar únicamente modificadores dentro de un grupo.

**Descripcion:**
- Validar que el campo Orden de la pestaña Modificadores permita modificar la posición de los modificadores sin alterar la posición del grupo modificador.

**Precondiciones:**
A. Contar con una plantilla descargada correctamente.
B. Existir un producto con un grupo modificador que contenga al menos 3 modificadores.
C. Identificar el orden original del grupo y de sus modificadores.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y acceder a la pestaña Modificadores.
2. Localizar el producto y el grupo modificador correspondiente.
3. Identificar los modificadores asociados y su valor actual en la columna Orden.
4. Modificar únicamente el orden de los modificadores.
5. Mantener sin cambios el orden del grupo modificador.
6. Guardar la plantilla y realizar la carga.
7. Consultar el producto en Visor CORE.

**Resultado esperado:**
A.El grupo modificador conserva su posición.
B.Los modificadores se muestran dentro del grupo en el orden definido en la plantilla.
C.Ningún otro grupo modificador cambia de posición como consecuencia de la modificación.

---

### Caso de prueba: CP45
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 10
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenar simultáneamente grupos modificadores y modificadores.

**Descripcion:**
- Validar que ambos niveles de ordenamiento puedan modificarse en una misma plantilla y que los cambios se reflejen correctamente.

**Precondiciones:**
A. Contar con un producto asociado a múltiples grupos modificadores.
B. Cada grupo debe contener múltiples modificadores.
C. Contar con plantilla editable y permisos para realizar la carga.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla.
2. En la pestaña GrupoModificador, modificar el campo Orden de los grupos.
3. En la pestaña Modificadores, modificar el campo Orden de los modificadores asociados.
4. Guardar la plantilla.
5. Realizar la carga del menú.
6. Consultar el producto en Visor CORE.
7. Validar primero el orden de los grupos.
8. Consultar cada grupo y validar el orden de sus modificadores.

**Resultado esperado:**
A. Los grupos de modificadores se muestran en el orden definido en la plantilla.
B. Los modificadores de cada grupo se muestran en el orden establecido.
C. El orden de los modificadores se mantiene dentro del grupo correspondiente, conforme a lo definido en la plantilla.
D. Los cambios realizados en los grupos de modificadores y en sus modificadores se aplican de forma independiente

---

### Caso de prueba: CP46
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 11
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Modificar el orden de un menú existente.

**Descripcion:**
- Validar que un menú previamente cargado pueda actualizar el orden de grupos modificadores y/o modificadores mediante una nueva carga.

**Precondiciones:**
A. Contar con un menú previamente publicado.
B. El producto debe tener múltiples grupos y modificadores.
C. Conocer el orden actual mostrado en Visor CORE.
D. Contar con una plantilla para realizar la modificación.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE y registrar el orden actual.
2. Abrir la plantilla del menú existente.
3. Modificar el orden de uno o más grupos modificadores.
4. Modificar el orden de uno o más modificadores.
5. Guardar la plantilla.
6. Realizar la carga del menú existente utilizando el mecanismo de actualización/versionamiento correspondiente.
7. Esperar la finalización del proceso.
8. Consultar nuevamente el producto en Visor CORE.

**Resultado esperado:**
A. El menú existente se actualiza conforme a los cambios realizados.
B. Los grupos y modificadores actualizados reflejan la nueva posición definida.
C. La información que no fue modificada permanece sin cambios.
D. No se generan duplicados de grupos ni modificadores.

---

### Caso de prueba: CP47
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 12
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Media
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Menú sin cambios en el orden conserve su posición original.

**Descripcion:**
- Validar que volver a cargar una plantilla con los mismos valores de orden no provoque reordenamientos.

**Precondiciones:**
A. Contar con un menú publicado.
B. Identificar el orden actual de los grupos y modificadores.
C. Contar con la plantilla con los mismos valores de orden originales.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Consultar el producto en Visor CORE.
2. Validar el orden de cada grupo modificador.
3. Consultar el orden de los modificadores de cada grupo.
4. Abrir la plantilla.
5. Mantener sin cambios los valores de la columna Orden.
6. Cambiar el nombre de un  producto para identificación de la publicación del nuevo menú.
7. Guardar y cargar nuevamente la plantilla.
8. Consultar nuevamente el producto en Visor CORE.
9. Comparar la posición antes y después de la carga.

**Resultado esperado:**
A. Los grupos de modificadores mantienen la posición definida originalmente en la plantilla.
B. Los modificadores conservan su posición dentro de cada grupo, conforme a lo establecido en la plantilla.
C. El orden de los grupos y modificadores cambia únicamente cuando se especifica un nuevo valor en la columna “Orden” de la plantilla.
D. La actualización puede identificarse mediante el cambio de nombre del ítem realizado en el paso 6 de la sección “Pasos a ejecutar”.

---

### Caso de prueba: CP48
- Implementado: No
- Hoja origen: `Chili´s`
- Fila origen Excel: 13
- REQ: OrdenamientoGpoMod&Mod 2.0
- Importancia: Alta
- Fecha: 8/14/26
- Estatus Android: No aplica
- Estatus iOS: No aplica

**Titulo:** Ordenamiento con múltiples grupos y modificadores.

**Descripcion:**
- Consultar que un item contenga más de tres grupos modificadores que contengan multiples modificadores,  para validar que el ordenamiento se mantenga tal como se establece en la plantilla.

**Precondiciones:**
A. Contar con un producto que tenga más de tres grupos de modificadores.
B. Cada grupo deberá contener al menos tres modificadores.
C. Identificar el orden inicial de los grupos y sus respectivos modificadores.
D. Contar con acceso al Visor CORE para consultar el ordenamiento de los ítems.

**Datos:**
- No especificado en columna independiente; revisar pasos para datos de entrada.

**Pasos:**
1. Abrir la plantilla y localizar el ítem a modificar.
2. Consultar el orden inicial de los grupos de modificadores.
3. Consultar el orden inicial de los modificadores dentro de cada grupo.
4. Editar el orden de los grupos de modificadores.
5. Editar el orden de varios modificadores dentro de los grupos seleccionados.
6. Mantener sin cambios algunos grupos y modificadores.
7. Guardar la plantilla.
8. Realizar la carga de la plantilla.
9. Consultar el producto en Visor CORE.
10. Validar que los grupos de modificadores se encuentren en el orden definido en la plantilla.
11. Validar que los modificadores de cada grupo se encuentren en el orden definido en la plantilla.
12. Verificar que los grupos y modificadores que no fueron modificados conserven su orden original.

**Resultado esperado:**
A.Todos los grupos se muestran en el orden establecido en la plantilla.
- B Los modificadores de cada grupo se muestran en el orden definido en la plantilla.
C.Los grupos y modificadores que no fueron modificados conservan su posición original.
D.No se presentan duplicados, pérdida de registros ni asignación incorrecta de modificadores entre grupos.
E.La información visualizada en Visor CORE coincide con la configuración establecida en la plantilla.

---

## Observaciones e inconsistencias detectadas
- Los casos no contienen responsable ni comentarios en el Excel fuente.
- Los estatus Android e iOS aparecen como `No aplica` en todos los casos incluidos.
- La hoja `SBX` tiene rango `A1:M1048317`, pero solo contiene casos hasta la fila 13 y valores auxiliares de estatus en filas posteriores.
- La marca Burger King aparece escrita como `Burguer King` en algunos pasos/resumen del Excel; se conserva el contenido funcional original en los casos y se usa `Burger King` solo como nombre de escenario para normalizacion documental.
- Se detectan variaciones ortograficas y de formato en el Excel, por ejemplo `seleccioando`, `siguiemntes/siguinetes`, `multiples`, espacios dobles y pasos sin espacio despues del numero; se preserva la informacion funcional sin cambiar el sentido.
- Los casos `CP11`, `CP23`, `CP35` y `CP47` tienen importancia `Media`; el resto tiene importancia `Alta`.
- No se detectaron IDs duplicados ni faltantes en el rango `CP1` a `CP48`.
