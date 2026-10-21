import js from '@eslint/js'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { APP_ALIASES, noHexColors, SCOPE, unusedVars } from './shared.js'

const aliases = APP_ALIASES.join('|')

/**
 * Base de Henko para todo código TypeScript.
 *
 * - `any` prohibido y nada de silenciar al compilador (`@ts-ignore`,
 *   `@ts-expect-error`, `@ts-nocheck`).
 * - Todo `eslint-disable` lleva el motivo escrito al lado (`-- porque…`).
 * - Export nombrado (sin default salvo los archivos-contrato de Next).
 * - Orden de imports: externos → `@henko-software/*` → alias de la app → relativos.
 * - Sin colores sueltos.
 */
const base = tseslint.config(
	{
		ignores: [
			'**/dist/**',
			'**/.next/**',
			'**/coverage/**',
			'**/node_modules/**',
			'**/next-env.d.ts',
			'**/*.config.{js,mjs,cjs,ts}'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	comments.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
			import: importPlugin
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': unusedVars,
			'@typescript-eslint/ban-ts-comment': [
				'error',
				{
					'ts-ignore': true,
					'ts-expect-error': true,
					'ts-nocheck': true,
					'ts-check': false
				}
			],
			'@eslint-community/eslint-comments/require-description': [
				'error',
				{ ignore: [] }
			],
			'@eslint-community/eslint-comments/no-unlimited-disable': 'error',
			'import/no-default-export': 'error',
			'no-restricted-syntax': ['error', ...noHexColors],
			'simple-import-sort/exports': 'error',
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						[
							'^node:',
							`^@(?!${SCOPE.slice(1)}/)\\w`,
							`^(?!(${aliases})(/|$))\\w`
						],
						[`^${SCOPE}/`],
						[`^(${aliases})(/|$)`],
						['^\\.']
					]
				}
			]
		}
	},
	{
		// Los tokens son el único lugar donde se escriben colores.
		files: ['**/tokens/**'],
		rules: { 'no-restricted-syntax': 'off' }
	},
	prettier
)

export default base
