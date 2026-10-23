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

## Listados: filtros acumulables

Todo listado con filtros los **suma**: se prenden varios a la vez y cada uno
achica lo que dejan los demás. Nunca un filtro que reemplaza al anterior.

| Regla                            | Detalle                                                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entre filtros distintos: **Y**   | Estado = Pendiente **y** Local = Centro **y** Período = octubre                                                                                                                   |
| Dentro de un mismo filtro: **O** | Estado = Pendiente **o** Vencido (selección múltiple)                                                                                                                             |
| El buscador también suma         | el texto se combina con los filtros, no los borra                                                                                                                                 |
| Chips de lo activo               | un chip por valor («Estado: Pendiente ✕») que se saca solo, y «Limpiar filtros»                                                                                                   |
| En la URL                        | `?estado=pendiente,vencido&local=centro`: se comparte, sobrevive a recargar y a entrar a una ficha y volver                                                                       |
| Lo resuelve el back              | los filtros viajan por el contrato (zod, campos en lista blanca); paginación y total con todos aplicados. En modo de datos de ejemplo, el adaptador mock filtra igual que el real |
| Total visible                    | «23 de 412» con los filtros puestos                                                                                                                                               |
| Vacío por filtros                | dice qué filtros lo dejaron vacío y ofrece sacar el último o limpiar todo                                                                                                         |
| Opciones con conteo              | cuando es barato, cuántos resultados daría cada opción con los otros filtros puestos; las que darían 0, apagadas                                                                  |
| Mobile                           | bottom sheet con «Ver N resultados»; los chips scrollean en su fila                                                                                                               |

Red flags: un filtro que borra otro; filtros que se pierden al volver de una
ficha; un total que no cambia; filtros que sólo filtran la página que llegó.
