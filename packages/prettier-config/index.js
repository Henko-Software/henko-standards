import * as tailwind from 'prettier-plugin-tailwindcss'

/**
 * Prettier de Henko. Se usa desde el package.json de cada repo:
 * `"prettier": "@henko-software/prettier-config"`.
 *
 * El plugin de Tailwind va como objeto para que se resuelva desde este paquete
 * y no dependa de que cada repo lo instale.
 *
 * @type {import('prettier').Config}
 */
const config = {
	useTabs: true,
	tabWidth: 2,
	semi: false,
	singleQuote: true,
	jsxSingleQuote: true,
	printWidth: 80,
	trailingComma: 'none',
	arrowParens: 'avoid',
	bracketSpacing: true,
	bracketSameLine: false,
	plugins: [tailwind]
}

export default config
