# Feature flags y «ver como»

> Propuesto (sin aplicar aún): ningún repo de Henko tiene flags ni «ver
> como» todavía. Se arman en `henko-identity` + `henko-bff` + `henko-web`
> cuando llegue el primer módulo con más de un rol.

## Flags por sección y subsección

- Las claves **copian la nav**: `administracion` (sección) →
  `administracion.proveedores` (subsección) →
  `administracion.proveedores.exportar` (acción o bloque). Dos o tres niveles.
- **Catálogo en `henko-contracts`** (clave, padre, nombre, descripción) como
  `z.enum`: una clave que no existe no compila, ni en el front ni en los
  módulos.
- **Valor efectivo = el propio y el de todos sus ancestros.** Padre apagado
  apaga a los hijos aunque digan `true`. **Un hijo sin valor propio hereda el
  del padre**: prender una sección la muestra entera, y sólo se guarda un
  valor para una subsección cuando hay que tratarla distinto.
- Precedencia por nodo: `default (código) < env < base`. Raíces en `false`
  por defecto. Los flags son **por instancia** (cada cliente prende lo suyo)
  y se pueden acotar por `local_id`.
- **Panel en árbol**, sólo superadmin: al apagar un padre los hijos se ven
  deshabilitados pero conservan su valor; cada nodo dice si es propio o
  heredado; cada cambio se audita.
- **No** son permisos ni sirven para esconder bugs.

## El superadmin no tiene flags, en toda la cadena

Para el superadmin todo flag da `true` en **todos** los lugares donde un flag
decide algo, no sólo en lo que se muestra. Se resuelve **una sola vez por
request, en el BFF** (`resolveFlags(actor)`), y viaja resuelto:

- al front por `/me` (mapa de valores efectivos: el front no recalcula),
- a los módulos **dentro del token interno**, junto al actor. Los módulos
  nunca leen la tabla de flags ni deciden el bypass por su cuenta.

| Capa                                          | Para el superadmin                                                |
| --------------------------------------------- | ----------------------------------------------------------------- |
| Nav, menú del teléfono, ⌘K                    | ve la sección, con el indicador de «apagado para los usuarios»    |
| Rutas y vistas de `henko-web`                 | entra y se pinta, con el cartel del DS «Los usuarios no ven esto» |
| BFF (guard por clave)                         | pasa; al resto le da 404                                          |
| Casos de uso de los módulos                   | mismo resultado que el BFF (leen los flags del token)             |
| Mutaciones, exportaciones, impresión, subidas | funcionan de punta a punta                                        |
| Eventos en tiempo real y avisos               | le llegan                                                         |
| Cola sin internet                             | lo que encoló se acepta al sincronizar                            |

Excepción: **procesos sin persona** (consumidores del bus, crons, el
orquestador cuando corre solo) no son superadmin y respetan el flag.

## Ver como otro rol

El superadmin elige «Ver como» en el menú del usuario o en el menú del
teléfono: un rol, o un rol y una persona concreta (un cajero de un local).
No le cambia el rol: lo simula. Una **barra fija del DS** dice _«Estás
viendo como Cajero · Volver a superadmin»_ y no se puede cerrar.

- `viewAs` (`{ role, userId?, localId? }`) vive en la **sesión de
  `henko-identity`**, puesto por `POST/DELETE /me/view-as` que sólo acepta a
  un superadmin real. Nunca sale de un header, un query param ni
  `localStorage`.
- El actor del request tiene dos caras: `realUser` (quién es) y `effective`
  (rol, permisos, scope y `local_id` con los que se lo trata). El BFF manda
  las dos en el token interno. **Permisos, scope y flags usan `effective`;
  auditoría, trazas, sesión y el endpoint de volver usan `realUser`.**
- **Los flags se resuelven para el rol simulado**: mientras ve como otro, el
  superadmin no tiene bypass. Es la forma de ver lo que ve el cliente.
- **Como un rol**: puede hacer lo que ese rol puede hacer; queda auditado a
  su nombre con `view_as` en el detalle.
  **Como una persona concreta**: sólo lectura (el BFF devuelve 403
  `bff.view_as_read_only` en toda mutación y los botones se ven
  deshabilitados con el motivo).
- No se puede ver como otro superadmin ni encadenar. Se apaga al cerrar
  sesión y a las 8 horas.
- Volver o cambiar de rol no pide contraseña ni recarga la sesión: se
  invalida `/me` y se pinta de nuevo donde estaba.

## Tests

- Unit (BFF): herencia de flags, padre apagado gana, precedencia por nodo,
  superadmin todo `true`, superadmin en «ver como» resuelve como el rol,
  proceso sin persona sin bypass, un no-superadmin no puede activar `viewAs`.
- Unit (módulos): con un token de superadmin, un caso de uso de una sección
  apagada funciona; con `effective` de otro rol, no.
- E2E: usuario común no ve la sección y la API le da 404; superadmin la ve
  con cartel **y hace una mutación**; viendo como el rol la ve como el
  usuario; vuelve con un toque; como persona, una mutación da 403.

## Red flags

- Un módulo que lee la tabla de flags o decide el bypass por su cuenta.
- Un flag que esconde el botón pero el endpoint sigue andando, o el
  superadmin que ve la pantalla y recibe 404 de la API.
- Permisos o flags calculados con `realUser`, o auditoría con `effective`.
- «Ver como» resuelto sólo en el front.
- Cuentas de prueba por rol para ver cómo lo ve el cliente.
