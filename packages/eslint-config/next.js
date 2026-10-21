import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

import base from './base.js'
import { reactRules } from './react.js'
import { noHexColors, noRawControls } from './shared.js'

/**
 * Para la app Next (App Router). Suma a la base:
 *
 * - Reglas de Next (core web vitals) y de React.
 * - En `views/` y `features/`: sin controles HTML sueltos (se usa el DS) y sin
 *   importar adaptadores de datos directo (se usa el puerto: `data/<entidad>`).
 * - Globals del service worker para `public/sw.js`.
 * - Default export sólo en los archivos-contrato de Next.
 *
 * @param {{ rootDir?: string }} [options] carpeta de la app relativa a donde
 *   corre ESLint (en un monorepo, `apps/web`).
 */
const next = ({ rootDir = '.' } = {}) => [
	...base,
	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			'@next/next': nextPlugin,
			react: reactPlugin,
			'react-hooks': reactHooks
		},
		settings: { react: { version: 'detect' }, next: { rootDir } },
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules,
			// App Router: no hay carpeta pages/.
			'@next/next/no-html-link-for-pages': 'off',
			...reactRules
		}
	},
	{
		files: ['**/src/views/**/*.{ts,tsx}', '**/src/features/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-syntax': ['error', ...noHexColors, ...noRawControls],
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['data/*/*Adapter', 'data/*/fixtures', 'data/*/mock*'],
							message:
								'Las pantallas usan el puerto (`data/<entidad>`), nunca el adaptador ni los datos de ejemplo directo.'
						}
					]
				}
			]
		}
	},
	{
		files: ['**/public/sw.js'],
		languageOptions: {
			sourceType: 'script',
			globals: {
				self: 'readonly',
				caches: 'readonly',
				clients: 'readonly',
				fetch: 'readonly',
				skipWaiting: 'readonly',
				registration: 'readonly'
			}
		}
	},
	{
		files: [
			'**/src/app/**/page.tsx',
			'**/src/app/**/layout.tsx',
			'**/src/app/**/loading.tsx',
			'**/src/app/**/error.tsx',
			'**/src/app/**/global-error.tsx',
			'**/src/app/**/not-found.tsx',
			'**/src/app/**/template.tsx',
			'**/src/app/**/default.tsx',
			'**/src/app/**/route.ts',
			'**/src/app/**/manifest.ts',
			'**/src/middleware.ts',
			'**/src/i18n/request.ts'
		],
		rules: { 'import/no-default-export': 'off' }
	}
]

export default next
