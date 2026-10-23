# Reglas base de Henko

> Valen en **todos** los repos de Henko, para personas y para agentes de IA.
> Llegan a cada repo como paquete (`@henko-software/agent-rules`): el
> `CLAUDE.md` de cada repo las importa con
> `@node_modules/@henko-software/agent-rules/BASE.md`. Se cambian en
> `Henko-Software/henko-standards`, nunca copiadas en un repo.
>
> El `AGENTS.md` de cada repo tiene **sólo lo propio** (qué es, cómo se
> levanta, qué tiene de particular).

El detalle de cada tema está en `estandares/` de este mismo paquete
(`node_modules/@henko-software/agent-rules/estandares/`).

## Qué es Henko

Un ERP propio, armado por módulos de responsabilidad (administración, stock,
ventas, facturación…), que reemplaza a Aires en Big Pizza. Una instancia por
cliente. Front web único → BFF → orquestador → módulos. Ver
`estandares/arquitectura.md`.

## Código

- **Antes de crear, buscá si ya existe. Reusá antes de duplicar**
  (componentes, helpers, tipos, schemas).
- **TypeScript estricto.** Prohibido `any` y prohibido silenciar errores:
  nada de `@ts-ignore`, `@ts-expect-error` ni `as any`. `eslint-disable` sólo
  con el motivo escrito al lado (`-- porque…`); ESLint lo exige. Si el
  compilador se queja, el problema es el tipo.
- **zod en los bordes**: lo que entra de la API, formularios, datos externos,
  datos de ejemplo. De los schemas salen los tipos.
- **Hexagonal**: el negocio no conoce la infraestructura; se habla con
  puertos y la tecnología entra por adaptadores. En el front, las pantallas
  usan `data/<entidad>` (el puerto), nunca el adaptador. Ver
  `estandares/hexagonal.md`.
- **Design system y tokens.** Colores y estilos sólo desde los tokens de
  `@henko-software/ui`; nada de hex sueltos ni componentes paralelos a los
  del DS. ESLint lo corta.
- **Mobile y PWA siempre.** Toda pantalla se diseña y se prueba a 375px.
  Si hay push, siempre con «Mandarme una notificación de prueba» y
  diagnóstico (`estandares/mobile-y-pwa.md`).
- **SEO, GEO, AEO y agentes.** Lo privado (el ERP, el BFF, demo, staging)
  va `noindex` en todas las respuestas; lo público sale renderizado en el
  servidor con metadatos, sitemap, robots con bots de IA, JSON-LD y
  `llms.txt`, y se mide con Lighthouse e isagentready.com. Ver
  `estandares/seo-y-agentes.md`.
- **Textos**: nada escrito en el JSX; todo por next-intl (`messages/es.json`).
- **Feature flags por sección y subsección, nunca para el superadmin.** Las
  claves copian la nav; un hijo hereda del padre y un padre apagado apaga a
  los hijos. Para el superadmin todo flag da `true` en toda la cadena (front,
  BFF, casos de uso de los módulos, mutaciones, exportaciones, tiempo real),
  resuelto una vez en el BFF y llevado en el token interno; los procesos sin
  persona no tienen bypass. Lo que ve y los usuarios no lleva el cartel del
  DS «Los usuarios no ven esto». Ver `estandares/flags-y-ver-como.md`.
- **«Ver como» otro rol para el superadmin**, con barra fija para volver;
  `effective` para permisos, scope y flags, `realUser` para auditoría. Ver
  `estandares/flags-y-ver-como.md`.
- **Filtros acumulables** en todo listado: Y entre filtros, O dentro de uno,
  chips, en la URL y resueltos en el back. Ver
  `estandares/accesibilidad-y-ux.md`.
- **Cambios de schema = migración nueva.** Nunca editar una ya aplicada.
- Español en la documentación y en el texto que ve el usuario; inglés en
  código e identificadores.

## Configs y CI: salen de los paquetes

ESLint, Prettier, tsconfig, commitlint, hooks de git y CI **no se escriben en
cada repo**: cada repo tiene archivos de una línea que apuntan a
`@henko-software/*` y llama al workflow reutilizable de `henko-standards`. Si
una regla sirve para todos, se cambia en `henko-standards` y se publica.

## Checklist antes de dar por terminado

- [ ] `pnpm check` (formato + lint) en verde.
- [ ] `pnpm typecheck` en verde.
- [ ] Pantallas: probadas a 375px y en desktop; capturas en el PR.
- [ ] Si un hook de git falla, **el problema es tu código, no el hook**.
      Prohibido `--no-verify` y prohibido debilitar configs para que pase.

## Git

- Todo entra por **PR** a `main`, con el CI en verde.
- Antes de pushear, `git pull --rebase`: trabaja más de una persona a la vez.
- Conventional commits (`feat:`, `fix:`, `chore:`…); commitlint los exige.
- **Nunca commitear secretos** ni `.env` (sólo `.env.example`).
- Henko y SOFLY son organizaciones distintas: nada de código, datos ni
  credenciales de una en la otra.

## Si lo que hiciste sirve para todos los repos

Una convención, un componente que todos van a usar, una regla de lint, un
paso de CI: se cambia en `henko-standards` en la misma ronda, no se queda en
el repo.
