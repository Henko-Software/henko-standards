# Sin internet

Con cientos de locales, alguno se queda sin conexión todos los días. La venta
no puede frenar. Se diseña desde el día uno aunque se construya con el módulo
de ventas.

## Reglas que valen desde hoy para todo

- **Ids generados por quien crea el dato** (UUIDv7), no por la base.
- **Toda escritura es un comando idempotente** con id propio: si llega dos
  veces, cuenta una.
- Cada comando lleva fecha del dispositivo y fecha del servidor.
- Las ventas se agregan, no se pisan; el stock se calcula por movimientos.

## Qué anda sin conexión (asumido, a confirmar con el cliente)

Vender en mostrador, cobrar en efectivo, abrir y cerrar turno, consultar
productos y precios del local, imprimir ticket y comanda, facturar con CAEA.
Tarjeta, QR, anular y reportes piden conexión.

## Cómo

- La caja es la PWA instalada. Las secciones «sin internet» guardan su app
  con versión explícita y avisan cuando hay una nueva.
- Copia local de lo que necesita el local (catálogo, precios) en IndexedDB,
  con versión.
- Cola de comandos en la caja; se sube al volver la conexión.
- Si un precio cambió mientras estaba sin conexión, la venta respeta el
  precio cobrado y queda marcada para revisar.

## Dónde quedó

- `henko-pos` (turnos, ventas, movimientos de caja, sincronización por lote) y
  la sección `/caja` de `henko-web`, con el flag `pos`.
- **Sincronización:** cada comando devuelve `accepted`, `rejected` o `retry`.
  Un rechazo no frena al resto. Un `retry` corta el lote: lo que venía detrás
  vuelve a intentarse para no adelantarse.
- **Service worker:** sólo la app de `/caja` se guarda, en
  `henko-caja-<versión>`. La versión sale de `CAJA_VERSION`; si cambia, la caja
  avisa. La API nunca se cachea.
- **Al volver la conexión:** el evento `online` llega antes de que la red
  ande, así que la caja insiste a los 2, 5 y 15 s antes de esperar al próximo
  ciclo.
- **Sesión sin conexión:** 72 h. La caja guarda el CAEA de la quincena, su
  punto de venta y el último número; nunca contraseñas ni datos de tarjeta.
