# Juegos de datos

## Modelo

Un juego de datos representa una combinación funcional válida del portal:

```text
País → Marca → Sucursal → Agregador → Tipo de menú
```

Cada combinación tiene un `id` único y define sus datos operativos, escenarios habilitados y excepciones. La trazabilidad de CP pertenece al perfil de marca; varios datasets de una misma marca reutilizan los mismos CP documentales, pero mantienen artefactos y dependencias separados por `datasetId`.

## Organización

La carpeta `data/` contiene solo dos archivos:

```text
data/
├── datasets.data.ts
└── cases.data.ts
```

`datasets.data.ts` contiene perfiles de marca, combinaciones, overrides, tipos básicos y validaciones. `cases.data.ts` contiene las definiciones y valores generales de los escenarios, tipos de casos y constructores que generan las colecciones consumidas por los specs.

## Juegos actuales

| Dataset | País | Marca | Sucursal | Agregador | Tipo de menú | Rango CP marca |
| --- | --- | --- | --- | --- | --- | --- |
| `starbucks-wtc-rappi` | MEXICO | STARBUCKS | STARBUCKS WTC - 38109 | RAPPI | Delivery BIS | CP1-CP12 |
| `burgerking-aguilas-uber` | MEXICO | BURGER KING | Burger King - Aguilas - 12513 | UBER EATS | Delivery | CP13-CP24 |
| `vips-las-torres-uber` | MEXICO | VIPS | Vips - Las torres 81099 | UBER EATS | Delivery | CP25-CP36 |
| `chilis-aeropuerto-t1-uber` | MEXICO | CHILIS | CHILIS AEROPUERTO T1 - 1075 | UBER EATS | Delivery Codisys | CP37-CP48 |

Los cuatro datasets tienen habilitados los escenarios 1 al 12.

## Agregar una combinación de una marca existente

1. Agrega una entrada en `testDatasets` dentro de `datasets.data.ts`.
2. Define un `id` en kebab-case.
3. Indica país, `brandId`, sucursal, agregador y tipo de menú.
4. Declara `enabledScenarios` usando identificadores funcionales.
5. Agrega `overrides` solo cuando la combinación difiera del comportamiento general.
6. Ejecuta `npm run data:validate`.
7. Ejecuta `npm run dataset:init -- <datasetId>` para generar su plantilla inicial.

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
  enabledScenarios: implementedScenarios,
}
```

## Agregar una marca

Registra primero su perfil en `brandProfiles`, dentro del mismo `datasets.data.ts`, y después agrega el dataset. El perfil conserva la etiqueta usada por el portal, nombre para reportes, tag, hoja de trazabilidad documental y rango CP de la marca.

Ejemplo:

```ts
nuevaMarca: {
  label: 'NUEVA MARCA',
  displayName: 'Nueva Marca',
  tag: '@nueva-marca',
  sourceSheet: 'NM',
  traceability: { cpBase: 49 },
}
```

Si el cliente entrega numeración irregular, usa `cpOverrides` dentro del perfil de marca, no dentro del dataset.

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
brandProfiles[brandId].traceability.cpBase + número del escenario - 1
```

`cpOverrides` permite excepciones por identificador funcional cuando el cliente entregue una numeración irregular. Las dependencias entre escenarios se definen una vez dentro de `cases.data.ts`; no se repiten en cada dataset. Dos datasets de la misma marca pueden generar el mismo CP para el mismo escenario, pero sus artefactos permanecen aislados por `datasetId`.

## Validación

`npm run data:validate` comprueba:

- IDs y combinaciones funcionales únicas.
- Perfiles de marca y tags válidos.
- Rangos CP de marca enteros, positivos y sin solaparse con otra marca.
- Campos obligatorios de sucursal y combinación.
- Código de sucursal incluido en su etiqueta.
- Escenarios existentes y sin duplicados.
- CP válidos, permitiendo repetirlos solo cuando pertenecen a la misma marca y escenario.
- Fecha válida en formato `DD/MM/YYYY`.

Si cambia sucursal, agregador o tipo de menú y representa otra combinación funcional, crea otro dataset. Los escenarios nunca reutilizan artefactos pertenecientes a otro `datasetId`.
