# Framework Playwright - Alsea Delivery

## Preparacion

1. Ejecutar `npm ci` y `npx playwright install chromium` con Node 20 o superior.
2. Copiar `.env.example` a `.env`.
3. Configurar `APP_ACCOUNT_DISPLAY_NAME` con el correo que debe aparecer en landing.
4. Ejecutar `npm run typecheck` y `npm run test:list`.

La URL, las rutas y los selectores se configuran por variables de entorno. El rol
actual es Admin, el unico informado por el cliente. Las credenciales no se guardan
en `.env`, en el codigo ni en la documentacion del proyecto.

## Generacion manual de la sesion

El portal DEV rechaza el login cuando detecta un navegador controlado por
Playwright. El comando inicia una instancia independiente de Google Chrome con un
perfil temporal y Playwright se conecta solamente despues del acceso manual:

1. Ejecutar `npm run auth:manual`.
2. En la ventana independiente de Chrome, escribir manualmente usuario y contrasena.
3. Pulsar `Iniciar sesion` y completar cualquier validacion presentada por el portal.
4. Esperar a que el navegador llegue a `/landing/` y muestre la cuenta esperada.
5. Volver a la terminal y presionar Enter.
6. El comando se conecta a Chrome, guarda la sesion en `.auth/admin.json`, cierra
   esa instancia y elimina su perfil temporal.
7. Ejecutar `npm run test:session` para comprobar la reutilizacion.

El comando espera cinco minutos de forma predeterminada. El valor se controla con
`MANUAL_AUTH_TIMEOUT_MS`. Si la sesion expira, se ejecuta nuevamente
`npm run auth:manual`.

La conexion local usa el puerto configurado en `AUTH_CDP_PORT` y el perfil indicado
por `AUTH_CAPTURE_PROFILE_PATH`, que debe permanecer dentro de `.auth`. Si Chrome
no se encuentra en una ruta habitual, se configura su ejecutable mediante
`BROWSER_EXECUTABLE_PATH`.

Antes de abrir el navegador, el setup valida la estructura y la expiracion de los
tokens Cognito guardados. Una sesion vencida o con menos de un minuto de vigencia
restante falla con un mensaje que solicita ejecutar `npm run auth:manual`. El margen
se configura mediante `AUTH_MINIMUM_VALIDITY_MS`.

`.auth/admin.json` contiene cookies y almacenamiento autenticado. Esta protegido
por `.gitignore` y no debe copiarse, compartirse ni versionarse.

## Ejecucion y reportes

Los casos CP1, CP13, CP25 y CP37 validan que Gmail reciba un correo nuevo de
`no-reply@grupoalsea.com.mx` con asunto `Descarga de la plantilla Desarrollo`.
El cuerpo debe contener el pais, la marca, la sucursal y el tipo de menu
seleccionados. El primer adjunto `.xls` o `.xlsx` se guarda en
`artifacts/downloads/<CP>/` sin inspeccionar su contenido. La espera maxima se
configura mediante `GMAIL_POLL_TIMEOUT_MS` y es de cinco minutos por defecto.

Las rutas de `credentials.json` y `token.json` se configuran en `.env` mediante
`GOOGLE_CREDENTIALS_PATH` y `GOOGLE_TOKEN_PATH`. Estos archivos contienen secretos
y no deben copiarse al repositorio ni incluirse en reportes.

- `npm test`: ejecuta la suite con historial basico de corrida.
- `npm run auth:manual`: abre Chrome independiente y captura la sesion despues del acceso manual.
- `npm run test:session`: valida que la sesion guardada abre landing sin otro login.
- `npm run test:smoke`: ejecuta las pruebas etiquetadas como smoke.
- `npm run test:headed`: ejecuta la suite con navegador visible.
- `npm run report`: abre el reporte HTML.

Los casos tambien se pueden filtrar por marca:

- `npx playwright test --grep "@starbucks"`
- `npx playwright test --grep "@burger-king"`
- `npx playwright test --grep "@vips"`
- `npx playwright test --grep "@chilis"`

Los reportes se generan en `playwright-report`, `reports` y `artifacts`. Estas rutas
tambien estan excluidas del repositorio.

## Dropdowns dinamicos

Los dropdowns y autocompletes de Ant Design deben operarse mediante helpers o Page
Objects compartidos. No se deben usar indices (`nth`, `first`, `last`) para
seleccionar opciones dinamicas, porque el overlay puede re-renderizarse entre la
lectura y el click. La seleccion debe reconstruir el locator por contenido estable
justo antes de interactuar, validar el valor aplicado y reintentar solo ante fallos
tecnicos de overlay/renderizado, sin ocultar datos inexistentes ni ambiguedades.

## Alcance actual

La linea base contiene configuracion DEV, sesion Admin manual reutilizable,
fixtures, diagnostico de fallos y reporting. Los CP1-CP48 estan documentados y
pendientes de implementacion.

Organizar Page Objects por pantallas y pruebas por escenarios o flujos. Los specs
deben importar `test` y `expect` desde `@fixtures/base.fixture`, utilizar assertions
web-first y mantener URLs, contexto y selectores fuera de los casos de prueba.
