# UX y accesibilidad

Lo que se revisa en toda pantalla, además del DS.

- **Estados**: cargando, vacío (con qué hacer), error (mensaje real y código),
  sin permiso. Una lista vacía dice qué hacer, no sólo «no hay datos».
- **Feedback de cada acción**: toast de éxito o error en toda acción que
  cambia algo.
- **Confirmación** del DS en toda acción riesgosa.
- **Teclado**: Esc cierra modales, el foco va al primer campo, foco visible.
- **Contraste** con tokens; `prefers-reduced-motion` respetado.
- **Textos**: etiquetas que nombran el objeto («Nuevo contacto», no
  «Nuevo»); errores de validación que nombran el campo; nada de jerga
  interna.
- **Números**: plata con símbolo; fechas en formato argentino.
- **Links profundos**: el estado importante va en la URL (`?q=`, `?rol=`)
  para poder compartirlo.
