import base from '@henko-software/eslint-config/base'

export default [
	...base,
	{ ignores: ['test/fixtures/**'] },
	{
		// Los paquetes de configs exportan por default: es lo que esperan
		// ESLint, Prettier y commitlint.
		files: ['packages/**/*.js'],
		rules: { 'import/no-default-export': 'off' }
	}
]
