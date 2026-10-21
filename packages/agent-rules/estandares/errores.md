# Errores

Todo error que llega al usuario tiene la misma forma, un mensaje para la
persona y un código para soporte:

```json
{
	"error": {
		"code": "identity.email_taken",
		"message": "Ese mail ya está en uso.",
		"ref": "H-4BF92F"
	}
}
```

- **`code`**: clave estable del catálogo (`<módulo>.<qué>`). El front puede
  decidir por ella.
- **`message`**: qué pasó y, si se puede, qué hacer, en español. El catálogo
  (`defineErrors`) lo exige: un error sin mensaje no compila.
- **`ref`**: código corto que sale de la traza. Se muestra en pantalla (el
  componente `ErrorState` del DS), lo adjunta el botón de feedback y en la
  Console lleva a la traza y los logs.
- **`details`**: sólo en errores de validación (4xx), con el problema de
  cada campo para mostrarlo al lado del campo.

## Reglas

- Nunca stack, mensaje interno ni datos de infraestructura en la respuesta:
  lo que no es del catálogo sale como `common.internal`.
- Los 5xx se loguean como error con todo el detalle y el `ref`; los 4xx,
  como advertencia.
- Errores comunes (`common.*`): `internal`, `validation`,
  `unauthenticated`, `forbidden`, `not_found`, `conflict`,
  `upstream_timeout`.
- Un login fallido responde siempre lo mismo, exista o no el usuario.
