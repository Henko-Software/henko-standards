# Seguridad

Se aplica **desde el día uno**, no «cuando salgamos a producción».

## Principios

1. **Zero trust adentro.** Estar en la misma red no da confianza: toda
   llamada entre servicios va autenticada. Bases, Redis y bus con
   credenciales.
2. **Mínimo privilegio.** Por módulo, roles de Postgres `owner` (sólo
   migraciones), `app` (sin DDL) y `ro`. Auditoría sin `UPDATE`/`DELETE`.
   Contenedores no-root, `cap_drop: ALL`, sistema de archivos de sólo lectura.
3. **Secretos como archivos**, nunca en la imagen, build args, compose,
   variables `NEXT_PUBLIC_*`, logs ni el repo.
4. **Privacidad en la puerta.** Se guarda sólo lo que se usa; a logs,
   telemetría y LLM no llega nada identificable. Un contacto se puede
   anonimizar.
5. **Instancias aisladas.** Nada propio de un cliente en el código.
6. **El back no confía en el front.** Todo lo que llega lo pudo escribir un
   atacante con `curl`.

## El back no confía en el front

- Default-deny global: una ruta nueva nace cerrada.
- zod en body, query, params y cabeceras que se usen.
- Precio, total, descuento, autor, rol y local los decide el servidor, nunca
  el body.
- Sin mass assignment: nunca `{ ...input }` hacia la base.
- Cada id se busca filtrando por el alcance de la sesión (si no es suyo,
  404).
- La respuesta sale por DTO, nunca la fila entera.
- Archivos: tipo real por contenido, tope de tamaño, nombre generado.

## En el front

- La sesión va en cookie `httpOnly`, nunca en `localStorage`.
- Ocultar un botón no es un permiso: el back valida igual.
- Ningún secreto en el bundle. Lo que viaja al navegador es público.
- Nada de HTML sin sanitizar (`dangerouslySetInnerHTML` prohibido salvo
  contenido propio revisado).

## Lo que suma Henko

- Desde internet sólo se ve el BFF.
- Cada servicio tiene identidad propia; el usuario viaja como token firmado,
  nunca como cabeceras sueltas.
- Cada caja es un dispositivo dado de alta, con clave propia y revocable.
- El equipo entra a las instancias por VPN.
- Imágenes firmadas y escaneadas; Actions fijadas por SHA.

## Páginas públicas de una instancia (sin login)

Lo que un cliente del local abre sin cuenta (opinar por el QR del ticket,
hacerse socio, ver su saldo) sigue estas reglas:

- Pasa por el BFF en `/api/public/<módulo>/*` (prefijo en `PUBLIC_PATHS`),
  que llama al módulo **como anónimo** (`{ origin: 'person', id:
'anonymous', role: 'anonymous' }`, igual que el login). El módulo decide
  qué deja hacer a un anónimo; nunca le pasa datos de otros.
- Límite por IP en el BFF (lecturas y envíos por separado) y, si hace falta,
  uno de negocio en el módulo (por dispositivo con una cookie `httpOnly` del
  BFF y por red con el **hash de la IP con pimienta**: la IP no sale del BFF).
- `X-Robots-Tag: noindex` en la respuesta y `robots: noindex` en la página.
- Si el link sale de algo impreso (un ticket), va **firmado**: una clave
  derivada por dispositivo (HMAC) que no sirve para nada más, y lo valida
  el dueño del dato. Ver `henko-pos` (`reviewTickets.ts`) y `henko-reviews`.
- No hay flags de persona: se decide en un solo lugar dónde nace el link
  (el QR sale sólo con el flag prendido) o con una variable de la instancia.

## Operación

- 2FA obligatorio en GitHub y en toda cuenta del proyecto.
- Push protection y escaneo de secretos (gitleaks en CI). gitleaks mira
  **toda la historia**: un valor de prueba con forma de clave en un commit
  viejo corta el CI aunque ya no esté. Los valores de prueba van con poca
  entropía (`'x'.repeat(40)`); si ya se subió uno, su huella va a
  `.gitleaksignore` con el motivo.
- Baja de accesos el mismo día que alguien sale.
- Nunca un dump de producción sin anonimizar en una notebook; disco cifrado.
- Backups cifrados con restauración probada.

## Checklist de seguridad (PR)

- [ ] Nada que confíe en el front para decidir permisos, precios o autor.
- [ ] zod en todo lo que entra.
- [ ] Sin secretos, `.env` ni datos reales en el commit.
- [ ] Acción sensible nueva → auditada.
- [ ] Logs sin datos personales.
