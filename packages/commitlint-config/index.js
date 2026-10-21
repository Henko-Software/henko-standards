import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * Commits convencionales (`feat:`, `fix:`, `chore:`…), con scope opcional
 * (`feat(contactos): …`). El cuerpo y el pie no tienen tope de largo de línea:
 * llevan detalle y URLs que no se cortan.
 *
 * `extends` va con la ruta resuelta desde este paquete: commitlint resuelve
 * los nombres desde el repo que lo usa, donde la dependencia no está a la vista.
 */
export default {
	extends: [require.resolve('@commitlint/config-conventional')],
	rules: {
		'body-max-line-length': [0, 'always'],
		'footer-max-line-length': [0, 'always']
	}
}
