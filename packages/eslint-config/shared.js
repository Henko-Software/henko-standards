/**
 * Piezas que comparten las variantes. No se importa desde los repos.
 */

export const SCOPE = '@henko-software'

/** Carpetas de `src/` que las apps importan con alias absoluto. */
export const APP_ALIASES = [
	'app',
	'views',
	'features',
	'components',
	'config',
	'data',
	'i18n',
	'utils',
	'assets'
]

/**
 * Colores sueltos: un hex en el código saltea los tokens del DS. El único
 * lugar donde se escriben es `tokens/`. Si hace falta uno de verdad (por
 * ejemplo `themeColor` del layout, que Next serializa a <meta>), va con
 * `eslint-disable-next-line no-restricted-syntax -- motivo`.
 */
const HEX = '/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z])/'
export const noHexColors = [
	{
		selector: `Literal[value=${HEX}]`,
		message:
			'Colores sólo desde los tokens del DS (bg-accent, text-muted…). Si falta uno, se agrega en packages/ui/src/tokens.'
	},
	{
		selector: `TemplateElement[value.raw=${HEX}]`,
		message:
			'Colores sólo desde los tokens del DS (bg-accent, text-muted…). Si falta uno, se agrega en packages/ui/src/tokens.'
	}
]

/**
 * Controles nativos en pantallas: se usa el componente del DS, que ya trae
 * tamaños táctiles, foco, estados y tokens. Si falta uno, se agrega al DS.
 */
export const noRawControls = [
	{
		selector:
			'JSXOpeningElement[name.name=/^(button|input|select|textarea|dialog|table)$/]',
		message:
			'Usá el componente del DS (@henko-software/ui): Button, Input, Select, Textarea, Modal, Table… Si falta, se agrega al DS, no a la pantalla.'
	}
]

export const unusedVars = [
	'error',
	{
		argsIgnorePattern: '^_',
		varsIgnorePattern: '^_',
		caughtErrorsIgnorePattern: '^_'
	}
]
