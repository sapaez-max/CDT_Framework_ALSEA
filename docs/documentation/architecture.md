# Arquitectura

## Modelo general

Los 48 casos de prueba documentales se representan mediante 12 escenarios funcionales. Cada spec recorre los juegos de datos habilitados y genera un resultado independiente por combinación, conservando la trazabilidad del CP y la marca sin duplicar el flujo.

```text
Escenario funcional + marca + juego de datos → ejecución Playwright
```

Un juego de datos representa una combinación aprobada de país, marca, sucursal, agregador y tipo de menú. La marca conserva el rango CP documental; una marca puede tener varias combinaciones sin requerir nuevos specs ni nuevos CP.

## Responsabilidades

| Componente | Responsabilidad |
| --- | --- |
| `scenarios/` | Declarar los tests y sus tags |
| `workflows/` | Coordinar el recorrido funcional y transportar el contexto |
| `services/` | Encapsular las operaciones de Gmail y Excel |
| `validators/` | Comparar resultados fuera de los Page Objects |
| `data/` | Definir catálogos, perfiles de marca, datasets, valores de escenario y mapeos de CP |
| `support/` | Administrar contexto, annotations y artefactos |
| `pages/` | Localizar e interactuar con pantallas del portal |
| `src/integrations/` | Implementar clientes de servicios externos |
| `src/reporting/` | Construir evidencias y adaptar nombres del reporte |
| `src/utils/` | Procesar Excel, sesiones, archivos y datos compartidos |

Los Page Objects se limitan a selectores y operaciones de pantalla. La coordinación funcional permanece en workflows y la lógica de datos en servicios, validadores o utilidades.

## Datos y escenarios

La carpeta `data/` contiene únicamente:

- `datasets.data.ts`: perfiles de marca con trazabilidad CP, combinaciones aprobadas, escenarios habilitados, overrides, tipos básicos y validación.
- `cases.data.ts`: definición y valores generales de escenarios, dependencias, cálculo de CP, tipos específicos y constructores de casos.

Los specs, workflows y validators consumen los casos generados. Agregar una combinación normal solo modifica `datasets.data.ts`; `cases.data.ts` cambia cuando se incorpora o modifica un comportamiento funcional.

Los escenarios 1 al 12 están implementados y habilitados para los datasets configurados.

## Contexto entre etapas

Los escenarios posteriores no reconstruyen datos dinámicos con la hora actual. Recuperan el item, la categoría, el grupo, los modificadores y el timestamp real desde el Excel, metadata o artefacto generado. `menu-golden-path.workflow.ts` permite transportar directamente el contexto cuando se ejecuta la cadena completa.

La persistencia en disco permite ejecutar casos por separado, siempre que exista el artefacto del caso anterior para el mismo dataset.
