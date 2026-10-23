# SEO, GEO, AEO y listo para agentes

**Lo público de Henko se encuentra en Google y en los buscadores con IA y lo
pueden leer los agentes; lo privado no aparece en ninguno.** Va desde la
primera versión de cada superficie, no se agrega después.

> Propuesto (sin aplicar aún): ningún repo de Henko lo tiene todavía. Se
> aplica en `henko-web` y en el `bff` en la próxima ronda de cada uno.

| Sigla           | Qué busca                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **SEO**         | Aparecer en Google/Bing: indexable, rápido, metadatos buenos                                         |
| **GEO**         | Que un LLM con búsqueda **cite** la página al responder                                              |
| **AEO**         | Que la página **sea la respuesta** (fragmento destacado, AI Overview, voz)                           |
| **Agent-ready** | Lo que mide [isagentready.com](https://isagentready.com): que un agente descubra, lea y use el sitio |

## Público o privado

| Superficie  | En Henko                                                                 | Qué se aplica                   |
| ----------- | ------------------------------------------------------------------------ | ------------------------------- |
| **Privada** | el ERP entero (`henko-web` detrás de login), el BFF, demo, staging, POCs | [§ Privado](#privado)           |
| **Pública** | sitio de Henko, documentación pública, páginas públicas de un cliente    | [§ Público](#público) y GEO/AEO |

Ante la duda, privado. Una ruta pública dentro del ERP (ej. un comprobante
compartido por link) es privada igual: no se indexa.

## Privado

- Header `X-Robots-Tag: noindex, nofollow` en **todas** las respuestas, del
  front y del BFF (cubre también PDFs e imágenes), y
  `<meta name="robots" content="noindex">` en el layout.
- `robots.txt` con `User-agent: *` / `Disallow: /`. El `Disallow` solo no
  saca de Google una URL linkeada en otro lado: va siempre con el `noindex`.
- Sin sitemap, sin `llms.txt`, sin JSON-LD.
- El `manifest` de la PWA no cambia: instalar no es indexar.

## Público

| Pieza              | Detalle                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Render en servidor | El contenido sale en el HTML (SSG/SSR). Los crawlers de IA **no corren JS**.                                                                |
| Metadatos          | `title` y description únicos por página, canonical absoluto, Open Graph (imagen 1200×630), `lang="es-AR"` y `hreflang` si hay idiomas       |
| `sitemap.xml`      | Generado en el build con `lastmod` real; sólo URLs canónicas que dan 200                                                                    |
| `robots.txt`       | Generado, con `Sitemap:` y los bots de IA listados explícitamente (ver abajo)                                                               |
| HTML semántico     | un `<h1>`, jerarquía sin saltos, `main`/`nav`/`article`, `alt`, links que dicen adónde van ([accesibilidad-y-ux.md](accesibilidad-y-ux.md)) |
| 404 real           | Lo que no existe responde **status 404**, no un 200 que dice "no encontrado"                                                                |
| Rendimiento        | Lighthouse **mobile**: SEO 100, Performance y Accesibilidad ≥ 90                                                                            |

## GEO y AEO

- **JSON-LD** generado desde los mismos datos que pintan la página:
  `Organization` + `WebSite` en la home (con `sameAs` a los perfiles
  oficiales), `SoftwareApplication` para el producto, `BreadcrumbList`,
  `FAQPage` donde haya preguntas **visibles**, `Article` con `author` y
  fechas en la documentación. Nunca marcar algo que no se ve.
- **Pregunta como título, respuesta en la primera oración**, con datos
  concretos en texto (no en imágenes ni PDFs).
- Páginas de confianza: quiénes somos, contacto, privacidad, términos.
- **`llms.txt`** en la raíz ([llmstxt.org](https://llmstxt.org)): `# Henko`,
  `> resumen`, secciones con links a lo importante. Generado desde las rutas
  del sitemap. En la documentación, además, versión Markdown de cada página.
- **Bots de IA**: búsqueda y respuesta (`OAI-SearchBot`, `ChatGPT-User`,
  `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`)
  siempre permitidos; entrenamiento (`GPTBot`, `ClaudeBot`, `Google-Extended`,
  `Applebot-Extended`, `CCBot`) permitidos salvo que se decida lo contrario,
  y en ese caso con `Content-Signal: ai-train=no, search=yes, ai-input=yes`.

## Agentes que usan Henko

Un ERP es justo lo que un agente quiere operar (cargar un pedido, consultar
un saldo). Cuando se abra para eso:

- **OpenAPI generado desde `henko-contracts`** (los schemas zod son la
  fuente; nunca escrito a mano), listado en `/.well-known/api-catalog`
  (RFC 9727).
- **Servidor MCP** como un adaptador más del BFF: entra con la identidad y
  los permisos de una persona o de un usuario de servicio, cada acción se
  audita con su `trace_id` igual que desde la web ([trazabilidad.md](trazabilidad.md),
  [seguridad.md](seguridad.md)). Su tarjeta en `/.well-known/` según la spec
  vigente de MCP.
- Nunca se publica una tarjeta (MCP, A2A, API) de algo que no existe.

## Cómo se mide

Antes de publicar una superficie pública y después de cada cambio grande:
Lighthouse mobile, [isagentready.com](https://isagentready.com) sobre la URL
real, [Rich Results Test](https://search.google.com/test/rich-results),
`curl -s <url>` (el contenido tiene que estar en el HTML) y `curl -sI` de una
ruta inexistente (`404`) y de una privada (`X-Robots-Tag: noindex`). Al salir:
Google Search Console y Bing Webmaster Tools con el sitemap enviado.

## Checklist

- [ ] Privado: `X-Robots-Tag: noindex, nofollow` en front y BFF + `robots.txt` con `Disallow: /`
- [ ] Público: HTML del servidor, metadatos y canonical por página, sitemap, robots con bots de IA
- [ ] Público: JSON-LD validado, `llms.txt` generado, FAQ con respuesta directa
- [ ] Lighthouse mobile e isagentready corridos y anotados
