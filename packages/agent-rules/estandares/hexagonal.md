# Arquitectura hexagonal (puertos y adaptadores)

El negocio queda en el centro y la tecnología (HTTP, Postgres, el bus, ARCA)
se enchufa por afuera. Las dependencias apuntan siempre hacia adentro.

## En un módulo o en el orquestador

```
src/
├── domain/          # entidades, value objects, reglas, errores. TS puro.
├── application/
│   ├── use-cases/   # una operación de negocio por archivo
│   └── ports/       # interfaces en idioma de negocio (ProductCatalog, AuditTrail)
├── adapters/
│   ├── in/          # http (controllers), events (consumidores), jobs
│   └── out/         # postgres, outbox, clientes de otros módulos, ARCA, memory
└── main.ts          # composición: qué adaptador va en cada puerto
```

- `domain/` no importa nada fuera de `domain/`.
- `application/` importa `domain/` y sus puertos; nunca Nest, Drizzle ni un
  cliente HTTP.
- `adapters/` importa `application/`; un adaptador no importa a otro.
- Lo hace cumplir `@henko-software/eslint-config/module`.

**El caso de uso es el punto único:** una operación = una transacción. Ahí
se escribe la auditoría y se guarda el evento del outbox, por los puertos
`AuditTrail` y `EventPublisher`. Actor, local y traza llegan del contexto
del request.

**ARCA es un puerto** (`FiscalAuthority`) con adaptadores real,
homologación y fake: se desarrolla sin certificados.

## En el front

Lo mismo, en chico: las pantallas usan el puerto `data/<entidad>` y no saben
si del otro lado hay datos de ejemplo o el BFF. Ver
[datos-de-ejemplo.md](datos-de-ejemplo.md).
