---
name: servicio-nuevo
description: Usar cuando hay que crear un servicio (módulo) nuevo del back de Henko — stock, ventas, facturación, el orquestador — o cuando alguien dice «armá el módulo X», «servicio nuevo», «repo nuevo para X». Arma el repo con `henko new service` (no con un template repo), lo suma a henko-infra y deja el CI con henko doctor.
---

# Servicio nuevo de Henko

Un servicio nuevo **no se copia a mano de otro repo**: sale de
`henko new service`, que trae la forma de `henko-identity` (domain →
application → adapters, composition, migraciones, trazas, CI con
`henko doctor`) y se actualiza junto con `@henko-software/cli`.

Antes de arrancar, leé:

- `${CLAUDE_PLUGIN_ROOT}/estandares/servicios.md` (lo que no se negocia)
- `${CLAUDE_PLUGIN_ROOT}/estandares/hexagonal.md`
- `${CLAUDE_PLUGIN_ROOT}/estandares/arquitectura.md` (dónde encaja el módulo)

Si el repo donde estás tiene `node_modules/@henko-software/agent-rules/`,
manda esa versión: es la que fijó el repo.

## Pasos

1. **Nombre y puerto.** Una palabra en minúsculas (`stock`, `ventas`): es la
   base de Postgres, los roles (`<nombre>_app`, `_owner`, `_ro`), la
   audiencia del token interno y el stream de NATS. El puerto, uno libre de
   la serie 32xx (bff 3200, identity 3201): mirá los `.env.example` de los
   otros servicios y el README de `henko-infra`. Si no está claro qué datos
   son del módulo, **preguntá**: no se inventa el alcance.
2. **Generarlo**, en la carpeta de los repos de Henko:

   ```bash
   npx @henko-software/cli new service <nombre> --port <puerto>
   cd henko-<nombre> && git init -b main && pnpm install && pnpm format
   ```

3. **Contrato primero** en `henko-contracts`: seguí la skill
   `henko:contrato-nuevo` para `packages/contracts-<nombre>`. Cuando esté
   publicado, tipá `src/domain/errors.ts` con su `<Nombre>ErrorKey`.
4. **henko-infra**: sumar el nombre a `HENKO_SERVICES` en `.env` y
   `.env.example` y correr el init de Postgres (README de henko-infra,
   «Sumar un servicio»). No bajes contenedores que use otra persona.
5. **El primer caso de uso** con la skill `henko:modulo-hexagonal`.
6. **Completar el README** (qué datos son del módulo, rutas, eventos) y
   `AGENTS.md` con lo propio. Nada de copiar reglas generales: se importan.
7. **Verde antes del primer push:** `pnpm check`, `pnpm typecheck`,
   `pnpm test`, `npx @henko-software/cli doctor`.
8. **Repo en la org**, privado:
   `gh repo create Henko-Software/henko-<nombre> --private --source . --push`.

## Red flags

- Copiar carpetas de `henko-identity` en vez de generar: se arrastran casos
  de uso y migraciones que no son del módulo.
- Escribir configs (ESLint, tsconfig, CI) en el repo: salen de los paquetes y
  `henko doctor` lo marca.
- Un servicio que lee la base de otro, o que recibe `x-user-id` en vez del
  token interno.
