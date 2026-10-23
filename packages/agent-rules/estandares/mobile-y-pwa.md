# Mobile y PWA

**Todo Henko anda en el teléfono y se instala como PWA.** No es un extra: va
desde el día uno.

## Mobile

Se diseña **a 375px** y se agranda, no al revés.

- **Navegación**: barra inferior (hasta 5 destinos) o drawer.
- **Modales**: en el teléfono, bottom sheet o pantalla completa.
- **Tablas**: scrollean adentro de su contenedor o pasan a cards. La página
  nunca scrollea en horizontal.
- **Táctil**: objetivos de 44×44px como mínimo; nada que dependa de hover.
- **Inputs**: `inputMode` correcto y fuente de 16px o más (si no, iOS hace
  zoom).
- **Safe areas**: `env(safe-area-inset-*)` en lo que toca los bordes.
- **Barras fijas** no tapan contenido: el listado deja espacio abajo.

## PWA

| Pieza                  | Detalle                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `manifest.webmanifest` | nombre, `display: standalone`, colores de los tokens, íconos 192/512 + maskable |
| Layout                 | `appleWebApp`, `apple-touch-icon`, `themeColor`                                 |
| `public/sw.js`         | red primero para navegaciones con fallback a `offline.html`                     |
| Registro               | `PwaRegister` registra el SW después del `load`                                 |

**Diferencia con SOFLY:** las secciones que tengan que andar sin internet
(ventas en el local) sí van a guardar su app en el navegador, con versión
explícita y aviso de actualización. Hasta que exista la primera, el SW no
cachea assets. Ver [sin-internet.md](sin-internet.md).

## Avisos push: siempre con prueba

Cuando haya push, en los ajustes de la app va **«Mandarme una notificación de
prueba»** para cualquier usuario: así nadie espera a un aviso real para
saber si anda.

- `POST /push/test` en el BFF: manda a **todos los dispositivos de quien la
  pide** (nunca a otros) por el mismo camino que un aviso real, con
  deep-link a los ajustes; 1 cada 30 s por usuario. Responde cuántos
  dispositivos la aceptaron y cuántos fallaron.
- **Diagnóstico paso a paso** en la misma pantalla, con qué hacer en cada
  caso: navegador que soporta push (en iPhone, sólo instalada), permiso del
  navegador, service worker activo, suscripción guardada en el server
  («Volver a activar»), claves VAPID cargadas, y el resultado por
  dispositivo (las suscripciones muertas se borran y se ofrece reactivar).
- El SW, al recibir la prueba, avisa a la pestaña abierta (`postMessage`)
  para que la pantalla diga «¡Llegó!» aunque el sistema la haya silenciado.
- El superadmin puede mandarle la prueba a otra persona desde su ficha (para
  soporte), auditado.

## Cómo se verifica

- [ ] DevTools a 375px: el flujo se completa sin scroll horizontal ni cosas
      tapadas.
- [ ] DevTools → Application: manifest sin errores y SW activo.
- [ ] Sin conexión: una navegación muestra `offline.html`.
- [ ] Si hay push: la notificación de prueba llega a Android y a iPhone
      (instalada) y el diagnóstico da todo en verde.
