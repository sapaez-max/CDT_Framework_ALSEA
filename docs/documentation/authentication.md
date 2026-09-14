# Autenticación

## Objetivo

El portal DEV rechaza el inicio de sesión cuando detecta un navegador controlado desde el comienzo por Playwright. El framework resuelve esta restricción capturando una sesión creada manualmente en una instancia independiente de Google Chrome.

## Captura de sesión

1. Ejecuta `npm run auth:manual`.
2. En la ventana independiente de Chrome, completa manualmente usuario y contraseña.
3. Pulsa `Iniciar sesión` y resuelve cualquier validación presentada por el portal.
4. Espera hasta llegar a `/landing/` y comprueba que aparezca la cuenta configurada.
5. Vuelve a la terminal y presiona Enter.
6. El comando se conecta a Chrome, guarda la sesión en `.auth/admin.json`, cierra esa instancia y elimina el perfil temporal.
7. Ejecuta `npm run test:session`.

El proceso espera cinco minutos de forma predeterminada. `MANUAL_AUTH_TIMEOUT_MS` permite modificar ese límite.

## Configuración

| Variable | Propósito |
| --- | --- |
| `APP_ACCOUNT_DISPLAY_NAME` | Cuenta que debe mostrarse después de iniciar sesión |
| `AUTH_ENABLED` | Habilita el uso del estado autenticado |
| `AUTH_ROLE` | Rol asociado al proyecto |
| `AUTH_STATE_PATH` | Archivo local donde se guarda la sesión |
| `AUTH_MINIMUM_VALIDITY_MS` | Vigencia mínima aceptada antes de una ejecución |
| `AUTH_CAPTURE_PROFILE_PATH` | Perfil temporal usado durante la captura |
| `AUTH_CDP_PORT` | Puerto local usado para conectar Playwright a Chrome |
| `BROWSER_EXECUTABLE_PATH` | Ruta de Chrome cuando no está en una ubicación habitual |

Antes de ejecutar pruebas, `globalSetup` revisa la estructura y expiración de los tokens Cognito guardados. Una sesión vencida o con menos vigencia que `AUTH_MINIMUM_VALIDITY_MS` falla con un mensaje que solicita repetir `npm run auth:manual`.

## Seguridad

`.auth/admin.json` contiene cookies y almacenamiento autenticado. La carpeta `.auth` está excluida mediante `.gitignore`. No copies, compartas ni versiones la sesión, credenciales, archivos OAuth o tokens.