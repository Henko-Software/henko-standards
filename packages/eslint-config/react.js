import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

import base from './base.js'

/** Lo que el DS permite como texto suelto en JSX: signos, no palabras. */
export const ALLOWED_JSX_STRINGS = [
	' ',
	'·',
	'—',
	'–',
	'/',
	'|',
	'•',
	':',
	'×',
	'‹',
	'›',
	'«',
	'»',
	'←',
	'→',
	'…',
	'(',
	')',
	'%',
	'$',
	'*',
	'+',
	'-',
	'#'
]

export const reactRules = {
	...reactPlugin.configs.flat.recommended.rules,
	...reactHooks.configs.recommended.rules,
	'react/react-in-jsx-scope': 'off',
	'react/prop-types': 'off',
	// Ningún texto visible escrito en el JSX: en las apps sale de next-intl,
	// en el DS llega por props.
	'react/jsx-no-literals': [
		'error',
		{
			noStrings: false,
			ignoreProps: true,
			allowedStrings: ALLOWED_JSX_STRINGS
		}
	]
}

/** Para librerías React, como el design system (`@henko-software/ui`). */
const react = [
	...base,
	{
		files: ['**/*.{ts,tsx}'],
		plugins: { react: reactPlugin, 'react-hooks': reactHooks },
		settings: { react: { version: 'detect' } },
		rules: reactRules
	}
]

export default react
