# Git, PRs y CI

## Git

- Todo entra por **PR a `main`** con el CI en verde.
- `git pull --rebase` antes de pushear.
- **Conventional commits** con scope opcional: `feat(contactos): alta`.
  commitlint lo exige.
- Prohibido `--no-verify` y prohibido debilitar hooks o configs.
- Nunca secretos, `.env`, dumps ni datos reales.

## Hooks (lefthook, desde `@henko-software/git-hooks`)

| Hook         | Qué corre                                 |
| ------------ | ----------------------------------------- |
| `pre-commit` | ESLint `--fix` y Prettier sobre lo staged |
| `commit-msg` | commitlint                                |
| `pre-push`   | `pnpm typecheck`                          |

## CI

Cada repo tiene un `.github/workflows/ci.yml` corto que llama al workflow
reutilizable de `henko-standards` (`ci-web.yml`, y los que vengan para
módulos). Corre: secretos (gitleaks), formato, lint, typecheck y build.

## PRs

- Descripción con qué cambia y por qué.
- Capturas a 375px y desktop si toca pantallas.
- Un PR, un tema.
