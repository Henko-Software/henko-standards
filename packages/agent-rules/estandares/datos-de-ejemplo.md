# Datos de ejemplo y POC

Mientras no hay back, el front trabaja con datos de ejemplo. Se arman de
forma que el día que llegue el back **no haya que tocar las pantallas**.

## Estructura de `apps/web/src/data/<entidad>/`

| Archivo          | Qué es                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `schema.ts`      | schema zod de la entidad y de lo que se crea/edita. De acá salen los tipos. Es el **borrador del contrato** con el back. |
| `port.ts`        | la interfaz que usan las pantallas (`list`, `get`, `create`…). Nombres de negocio.                                       |
| `fixtures.ts`    | datos de ejemplo realistas (nombres, CUIT, montos argentinos). Se validan con el schema.                                 |
| `mockAdapter.ts` | implementa el puerto con los fixtures, en memoria, con una demora corta para ver los estados de carga.                   |
| `index.ts`       | exporta el puerto ya armado con el adaptador que corresponde.                                                            |

Las pantallas importan **sólo** `data/<entidad>` (ESLint lo exige). Cuando
exista el BFF se agrega `bffAdapter.ts` y se cambia una línea en `index.ts`.

## Reglas

- Todo dato de ejemplo pasa por su schema (`schema.array().parse(...)`): si
  el ejemplo no cumple el schema, falla al cargar.
- Datos creíbles: nombres argentinos, CUIT con formato válido, montos en
  centavos, fechas ISO.
- Nada de datos reales de clientes ni de Big Pizza en los ejemplos.
- Un campo nuevo en una pantalla = un campo nuevo en el schema. El schema es
  lo que el back va a recibir como pedido.
