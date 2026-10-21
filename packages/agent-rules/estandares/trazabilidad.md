# Audit y trace

Cuatro capas que comparten identificadores para saltar de una a otra.

| Capa      | Pregunta                        | Cómo                                                                             |
| --------- | ------------------------------- | -------------------------------------------------------------------------------- |
| Trazas    | ¿Por dónde pasó y cuánto tardó? | OpenTelemetry; la traza nace en el BFF y viaja por HTTP, eventos y jobs          |
| Logs      | ¿Qué dijo el código?            | JSON con `trace_id`, `local_id`, actor, servicio, versión; sin datos personales  |
| Auditoría | ¿Quién cambió qué?              | append-only, actor + rol congelado + origen persona/automático, `before`/`after` |
| Flujos    | ¿En qué paso quedó?             | estado de cada flujo del orquestador                                             |

## Lo que ve el usuario

Todo error muestra un **código corto** (`H-7Q2K`) que apunta a la traza. En
el front, el componente de error del DS lo muestra y el botón de feedback lo
adjunta solo.

## El botón de feedback

En toda pantalla. Pide qué falló (señalando en pantalla), tipo, urgencia y
captura; suma solo la ruta, la versión y los últimos códigos de error. En la
Console se convierte en un prompt para arreglarlo.
