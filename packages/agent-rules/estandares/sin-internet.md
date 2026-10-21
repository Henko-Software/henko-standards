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

## Propuesta de qué anda sin conexión (a confirmar)

Vender en mostrador, cobrar en efectivo, abrir y cerrar caja, consultar
productos y precios del local, imprimir ticket y comanda, facturar con CAEA.

## Cómo

- La caja es la PWA instalada. Las secciones «sin internet» guardan su app
  con versión explícita y avisan cuando hay una nueva.
- Copia local de lo que necesita el local (catálogo, precios) en IndexedDB,
  con versión.
- Cola de comandos en la caja; se sube al volver la conexión.
- Si un precio cambió mientras estaba sin conexión, la venta respeta el
  precio cobrado y queda marcada para revisar.
