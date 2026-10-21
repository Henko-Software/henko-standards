# Design system

El DS vive en `@henko-software/ui` (hoy en `henko-web/packages/ui`). Tokens de
marca + componentes genéricos. La página `/ds` de la app los muestra todos.

## Reglas

1. **Todo componente visual sale del DS.** Si falta, se agrega al DS
   (genérico, con tokens), no se improvisa en la pantalla.
2. **El DS no conoce el negocio.** Si menciona «contacto», «venta» o
   «stock», no va en el DS: va en la app.
3. **El DS no traduce.** Recibe textos por props.
4. **Colores, radios y sombras sólo desde tokens.** Falta un color → se
   agrega un token, no un hex.
5. **Una sola implementación por cosa**: un modal, un select, un toast, una
   tabla.
6. **Una sola lista de navegación** (`config/nav.ts`) para sidebar, barra
   inferior y buscador.
7. **Íconos**: `react-icons` (Feather `fi`). Nada de SVG pegados.

## Tokens

`packages/ui/src/tokens/tokens.css`: canales RGB sueltos (`R G B`) para que
Tailwind pueda aplicar opacidad (`bg-accent/10`). El preset de Tailwind los
mapea a utilidades. Son **provisorios** hasta que el diseño defina la marca:
cambiarlos ahí cambia todo el sistema.

## Acciones riesgosas: confirmación

Borrar, anular, cambiar permisos, tocar plata o stock, publicar, acciones
masivas: siempre con `useConfirm()` del DS (nunca `window.confirm`). El texto
dice **qué** pasa, **sobre qué** y **si se puede deshacer**; el botón lleva
el verbo («Anular venta», no «Aceptar»). Lo irreversible o masivo pide
escribir el nombre para habilitar el botón.

## Red flags

- Un segundo modal/select/toast «porque era más rápido».
- Un color que no existe en los tokens.
- Una fila de tabla con tres botones en vez de un menú (kebab).
