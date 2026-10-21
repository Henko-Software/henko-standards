# Arquitectura

```
Usuarios ─► henko-web ─► henko-bff ─► henko-orchestrator ─► módulos
                                                   │            │
                                                   └─ eventos ──┴─► audit, reporting
```

- **Una instancia por cliente.** Mismo código para todos; cada cliente corre
  su copia con sus bases. Franquicias y locales del mismo cliente comparten la
  instancia y se separan por **alcance** (`local_id`), no por base.
- **henko-web**: la única app que ve el usuario. Next, PWA, responsive.
- **henko-bff**: sesión, permisos, respuestas a la medida de cada pantalla.
  Es lo único expuesto a internet. Arranca la traza.
- **henko-orchestrator**: dirige los flujos que cruzan módulos (pasos,
  compensación, reintentos). Propio, detrás del puerto `FlowEngine`.
- **Módulos**: uno por área de responsabilidad, cada uno con su repo y su
  base. Nadie lee la base de otro. El corte definitivo sale del POC del
  diseñador; cada módulo se confirma con un ADR.
- **Bus**: NATS JetStream, con outbox. Alimenta auditoría, reporting y
  avisos; los flujos los dirige el orquestador.

## Reglas de datos

- Plata en enteros de centavos + moneda; cantidades en `numeric`, nunca
  `float`.
- Fechas en UTC en la base; se muestran en hora de Argentina.
- Ids generados por quien crea el dato (UUIDv7), no por la base.
- `local_id` en toda tabla operativa y en todo evento.
- Contactos como en Odoo: una persona o empresa con roles (cliente,
  proveedor, franquicia, empleado). Los demás módulos guardan el id, nunca
  una copia.
- Cambiar un contrato = versión nueva conviviendo con la anterior.
