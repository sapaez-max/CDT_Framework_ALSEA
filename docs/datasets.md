# Juegos de datos

## Modelo

Un juego de datos representa una combinación funcional válida del portal:

```text
País → Marca → Sucursal → Agregador → Tipo de menú
```

Cada combinación tiene un `id` único y define sus datos, escenarios habilitados, trazabilidad de CP y excepciones. Agregar una combinación normal requiere modificar únicamente `datasets.data.ts`.

## Organización

La carpeta `data/` contiene solo dos archivos:

```text
data/
├── datasets.data.ts
└── cases.data.ts
```

`datasets.data.ts` contiene perfiles de marca, combinaciones, overrides, tipos básicos y validaciones. `cases.data.ts` contiene las definiciones y valores generales de los escenarios, tipos de casos y constructores que generan las colecciones consumidas por los specs.

## Juegos actuales

| Dataset | País | Marca | Sucursal | Agregador | Tipo de menú | CP inicial |
| --- | --- | --- | --- | --- | --- | --- |
| `starbucks-wtc-rappi` | MEXICO | STARBUCKS | STARBUCKS WTC - 38109 | RAPPI | Delivery BIS | 1 |
| `burgerking-aguilas-uber` | MEXICO | BURGER KING | Burger King - Aguilas - 12513 | UBER EATS | Delivery | 13 |
| `vips-las-torres-uber` | MEXICO | VIPS | Vips - Las torres 81099 | UBER EATS | Delivery | 25 |
| `chilis-aeropuerto-t1-uber` | MEXICO | CHILIS | CHILIS AEROPUERTO T1 - 1075 | UBER EATS | Delivery Codisys | 37 |

Los cuatro datasets tienen habilitados los escenarios 1 al 11.

## Agregar una combinación de una marca existente

1. Agrega una entrada en `testDatasets` dentro de `datasets.data.ts`.
2. Define un `id` en kebab-case.
3. Indica país, `brandId`, sucursal, agregador y tipo de menú.
4. Asigna `traceability.cpBase` con el número inicial entregado por el cliente.
5. Declara `enabledScenarios` usando identificadores funcionales.
6. Agrega `overrides` solo cuando la combinación difiera del comportamiento general.
7. Ejecuta `npm run data:validate`.
8. Ejecuta `npm run dataset:init -- <datasetId>` para generar su plantilla inicial.

Ejemplo:

```ts
{
  id: 'starbucks-polanco-uber',
  enabled: true,
  country: 'MEXICO',
  brandId: 'starbucks',
  branch: {
    code: '38200',
    name: 'STARBUCKS POLANCO',
    label: 'STARBUCKS POLANCO - 38200',
  },
  aggregator: 'UBER EATS',
  menuType: 'Delivery BIS',
  traceability: { cpBase: 49 },
  enabledScenarios: implementedScenarios,
}
```

## Agregar una marca

Registra primero su perfil en `brandProfiles`, dentro del mismo `datasets.data.ts`, y después agrega el dataset. El perfil conserva la etiqueta usada por el portal, nombre para reportes, tag y hoja de trazabilidad documental.

## Overrides

Los overrides actuales permiten configurar diferencias de descarga y validación de correo de filtros:

```ts
overrides: {
  downloadTemplate: {
    date: '03/08/2026',
    exactSelections: true,
  },
  uploadFilters: {
    validateEmail: true,
  },
}
```

La presencia de `date` activa la selección de fecha. La etiqueta exacta de sucursal se toma de `branch.label`.

## CP y dependencias

El CP se calcula con:

```text
cpBase + número del escenario - 1
```

`cpOverrides` permite excepciones por identificador funcional cuando el cliente entregue una numeración irregular. Las dependencias entre escenarios se definen una vez dentro de `cases.data.ts`; no se repiten en cada dataset.

## Validación

`npm run data:validate` comprueba:

- IDs y combinaciones únicas.
- Perfiles de marca y tags válidos.
- Campos obligatorios de sucursal y combinación.
- Código de sucursal incluido en su etiqueta.
- Escenarios existentes y sin duplicados.
- `cpBase` entero y positivo.
- CP válidos y sin colisiones.
- Fecha válida en formato `DD/MM/YYYY`.

Si cambia sucursal, agregador o tipo de menú y representa otra combinación funcional, crea otro dataset. Los escenarios nunca reutilizan artefactos pertenecientes a otro `datasetId`.