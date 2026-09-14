# Integración con Gmail

## Propósito

La automatización consulta el correo asociado al token mediante Google Gmail API y OAuth 2.0. Se utiliza para confirmar la descarga de plantillas y los resultados de carga de filtros o menús.

## Configuración

| Variable | Propósito |
| --- | --- |
| `GMAIL_ENABLED` | Habilita la integración |
| `GMAIL_ACCOUNT` | Cuenta asociada al token |
| `GMAIL_USER_ID` | Usuario usado por Gmail API; normalmente `me` |
| `GOOGLE_CREDENTIALS_PATH` | Ruta local de `credentials.json` |
| `GOOGLE_TOKEN_PATH` | Ruta local de `token.json` |
| `GMAIL_EXPECTED_FROM` | Remitente esperado |
| `GMAIL_EXPECTED_SUBJECT` | Asunto esperado para la descarga |
| `GMAIL_POLL_TIMEOUT_MS` | Espera máxima; cinco minutos por defecto |
| `GMAIL_POLL_INTERVAL_MS` | Intervalo de consulta |

Los archivos OAuth deben permanecer fuera del control de versiones y nunca se adjuntan al reporte.

## Descarga de plantilla

CP1, CP13, CP25 y CP37:

1. Capturan una línea base de mensajes coincidentes antes de solicitar la plantilla.
2. Realizan la solicitud desde el portal.
3. Consultan Gmail hasta encontrar un mensaje nuevo que no pertenezca a la línea base.
4. Validan remitente, asunto, país, marca, sucursal y tipo de menú.
5. No validan agregador porque el formulario de descarga no lo selecciona.
6. Localizan un adjunto `.xls` o `.xlsx`.
7. Si existen varios adjuntos Excel, exigen una coincidencia única por nombre.
8. Guardan el archivo en la carpeta de la corrida, CP y dataset.

La configuración inicial espera el remitente `no-reply@grupoalsea.com.mx` y el asunto `Descarga de la plantilla Desarrollo`.

Antes de guardar el nuevo archivo se eliminan únicamente los Excel anteriores del mismo CP y dataset, de modo que la combinación conserva un resultado vigente.

## Correos de carga

La carga de menú puede responder inicialmente con éxito o con el mensaje exacto `Endpoint request timed out`. Este último es un comportamiento aceptado del portal para procesamiento pesado, pero no aprueba el caso por sí solo.

Los escenarios de carga configurados con confirmación deben recibir un correo nuevo de resultado exitoso. Una notificación de error, un correo que no corresponda a la solicitud o la ausencia de respuesta dentro del tiempo configurado hacen fallar el caso.

El reporte separa la evidencia funcional del correo y su detalle técnico. Tokens, credenciales y contenido sensible ajeno a la validación no se incluyen.