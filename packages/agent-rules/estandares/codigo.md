# Código

## Principios

1. **Buscá antes de crear; reusá antes de duplicar.** Un segundo
   `formatMoney` es un bug.
2. **El código nuevo se ve como el que ya está.** Copiá el estilo del archivo
   vecino.
3. **Código e identificadores en inglés; docs, UI y commits en español.**
4. **Nada de lógica de negocio en la UI ni en el router.**

## TypeScript

- `strict` + `noUnusedLocals` + `noUnusedParameters` +
  `noUncheckedIndexedAccess` + `noFallthroughCasesInSwitch` +
  `noImplicitOverride` (`@henko-software/tsconfig`).
- **`any` prohibido.** Lo que entra de afuera es `unknown` y se afina con zod.
- **Prohibido silenciar**: `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`,
  `as any`. `eslint-disable` sólo con el motivo (`-- porque…`).
- Sin usar intencional → prefijo `_`.

## zod en todo borde

Respuestas de la API, formularios, query params, webhooks, env al arrancar,
datos de ejemplo, salida de un LLM. De los schemas salen los tipos
(`z.infer`), nunca se escriben dos veces.

## Naming

| Elemento               | Convención             | Ejemplo                             |
| ---------------------- | ---------------------- | ----------------------------------- |
| Carpetas               | `snake_case`           | `contact_list/`                     |
| Componente (`.tsx`)    | `PascalCase`           | `ContactCard.tsx`                   |
| Otros archivos (`.ts`) | `camelCase`            | `formatMoney.ts`                    |
| Hook                   | `use` + PascalCase     | `useContacts.ts`                    |
| Constante de módulo    | `SCREAMING_SNAKE_CASE` | `PAGE_SIZE`                         |
| Tipos                  | `PascalCase`           | `Contact`, `Props`                  |
| Variantes              | union de strings       | `type Tone = 'neutral' \| 'danger'` |

## Funciones

- Arrow functions para componentes y handlers.
- **Export nombrado**, nunca `export default` (salvo los archivos-contrato
  de Next). ESLint lo exige.
- `async/await`; los errores se manejan, nunca se tragan.
