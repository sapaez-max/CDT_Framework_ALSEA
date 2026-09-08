# Catalogo de casos de prueba

---

## Escenario: E0-LOGIN-ADMIN-01
**Descripcion:** Validar que el sistema permite autenticarse

### Caso de prueba: E0-LOGIN
- Implementado: Sí

**Titulo:** Validar que se tenga acceso al sistema

**Descripcion:** Validar que se pueda autenticarse al sistema.

**Precondiciones:**
1. Usuario creado en el sistema
2. El usuario debe ingresar para ejecutar cualquier acción.

**Datos:**
- Correo: emmanuel.ramirez@alsea.net
- Contraseña: Er@m1r3z08.0903

**Pasos:**
1. El usuario accede a la página de inicio de sesión (https://gl-woe.appdevalsea.com/Login)
2. Ingresa el correo y contraseña y da click en el botón "inicio de sesión"

**Resultado esperado:**
1-El usuario accede correctamente al sistema
2-se muestra el nombre de la cuenta

---

## Escenario: E02-CREACIÓN
**Descripcion:** Validar que el sistema pueda agregar un nuevo Almacen en el flujo de Inventarios

### Caso de prueba: E02-CREACIÓN
- Implementado: Sí

**Titulo:** Validar el correcto funcionamiento de agregar un nuevo registro en Almacen 

**Descripcion:** Validar que se pueda agregar un nuevo Almacen desde el modal "Agregar Almacen" de Inventarios

**Precondiciones:**
1. El usuario acceder al portal.
2. La distribución está en estado creada.
3. El nombre del Almacen se llame "Almacen automatizado"

**Datos:**
- Campos de formulario
- Nombre del Almacen

**Pasos:**
1. El usuario accede a la página de inicio ''Home''
2. El usuario selecciona de menú "Administración" > "Inventarios"> Almacenes.
3. El usuario presiona el botón "Nuevo Almacén".
4. Se levanta el modal "Nuevo almacén".
5. El usuario completa los campos.
6. El usuario presiona el botón Guardar".

**Resultado esperado:**
El nuevo registro ha sido agregado correctamente.
1-Se muestra el almacen creado en la barra de Almacenes

---

## Escenario: E03-SELECCION
**Descripcion:** Validar que el sistema permite asignar un item al nuevo almacen creado

### Caso de prueba: E03-SELECCION
- Implementado: Sí

**Titulo:** Validar que se pueda agregar un item al nuevo almacen creado 

**Descripcion:** Validar que se pueda visualizarla el menu de inventario 

**Precondiciones:**
1. El usuario debe ingresar al sitio.
2. Visualizar el almacen creado 

**Datos:**
- nombre del almacen "Almacen automatizado 1180"

**Pasos:**
1. El usuario accede a la página de inicio ''Home''
2. El usuario selecciona de menú "Administración" > "Inventarios"> Almacenes.
3. Selecciona la pestaña todos en la barrra lateral.
4. Selecciona un item aleatorio.
5. Se visualiza el modal de ''Agregar a almacén''
6. se selecciona el almacen.
7. El usuario presiona el botón "Guardar".
8. Seleccionar en la barra lateral el almacen 


**Resultado esperado:**
visualizar el item en el almacen
---
