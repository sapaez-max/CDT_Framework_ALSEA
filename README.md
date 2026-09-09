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

El portal DEV integra reCAPTCHA y el login completamente automatizado no logra
emitir la solicitud de autenticacion. La sesion se genera con intervencion humana:

1. Ejecutar `npm run auth:manual`.
2. En la ventana de Chrome, escribir manualmente usuario y contrasena.
3. Pulsar `Iniciar sesion` y completar cualquier validacion presentada por el portal.
4. Esperar a que el navegador llegue a `/landing/` y muestre la cuenta esperada.
5. El comando guarda la sesion en `.auth/admin.json` y cierra esa ventana.
6. Ejecutar `npm run test:session` para comprobar la reutilizacion.

El comando espera cinco minutos de forma predeterminada. El valor se controla con
`MANUAL_AUTH_TIMEOUT_MS`. Si la sesion expira, se ejecuta nuevamente
`npm run auth:manual`.

`.auth/admin.json` contiene cookies y almacenamiento autenticado. Esta protegido
por `.gitignore` y no debe copiarse, compartirse ni versionarse.

## Ejecucion y reportes

- `npm test`: ejecuta la suite con historial basico de corrida.
- `npm run auth:manual`: abre Chrome y guarda la sesion después del acceso manual.
- `npm run test:session`: valida que la sesion guardada abre landing sin otro login.
- `npm run test:smoke`: ejecuta las pruebas etiquetadas como smoke.
- `npm run test:headed`: ejecuta la suite con navegador visible.
- `npm run report`: abre el reporte HTML.

Los reportes se generan en `playwright-report`, `reports` y `artifacts`. Estas rutas
tambien estan excluidas del repositorio.

## Alcance actual

La linea base contiene configuracion DEV, sesion Admin manual reutilizable,
fixtures, diagnostico de fallos y reporting. Los CP1-CP48 estan documentados y
pendientes de implementacion.

Organizar Page Objects por pantallas y pruebas por escenarios o flujos. Los specs
deben importar `test` y `expect` desde `@fixtures/base.fixture`, utilizar assertions
web-first y mantener URLs, contexto y selectores fuera de los casos de prueba.
