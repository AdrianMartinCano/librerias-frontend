# Documentación de componentes

La documentación de cada librería vive ahora junto a su código, en el `README.md` de cada paquete. Cada README incluye instalación, configuración y ejemplos prácticos de uso.

La columna **Depende de** muestra de qué otras librerías del scope depende cada paquete
(las `peerDependencies` de Angular se omiten). Todas heredan la base **`ng-theme`**.
El mapa completo de capas está en el [README raíz → Arquitectura](../README.md#arquitectura--capas-de-dependencia).

### Fundamentos (sin dependencias)

| Paquete | Qué incluye | Depende de | Documentación |
|---|---|---|---|
| `@adrianmartincano/ng-theme` | Design system CSS: paleta, modo oscuro, foco accesible, motion, grid, animaciones, spinner | — *(base de todas)* | [README](../libs/shared/theme/README.md) |
| `@adrianmartincano/ng-models` | Interfaces y tipos compartidos | — | [README](../libs/shared/models/README.md) |

### Features (componentes y servicios)

| Paquete | Qué incluye | Depende de | Documentación |
|---|---|---|---|
| `@adrianmartincano/ng-ui` | Tabla, navbar, footer, botón, card, modal, loader, skeleton, toasts, ThemeService, I18nService | theme · models | [README](../libs/shared/ui/README.md) |
| `@adrianmartincano/ng-forms` | Formularios dinámicos con validación | theme · models | [README](../libs/shared/forms/README.md) |
| `@adrianmartincano/ng-auth` | Login/registro, JWT, guards, interceptor, social, **entrar con Google** (`<lib-google-button>`) | theme · models | [README](../libs/shared/auth/README.md) |
| `@adrianmartincano/ng-upload` | Subida de archivos drag & drop | theme · models | [README](../libs/shared/upload/README.md) |
| `@adrianmartincano/ng-products` | Catálogo, tarjeta, grid con filtros, CartService | theme · models | [README](../libs/shared/products/README.md) |
| `@adrianmartincano/ng-reservations` | Calendario, slots de hora, flujo de reserva, **multistaff** (agenda por profesional + timeline de día) | theme · models | [README](../libs/shared/reservations/README.md) |
| `@adrianmartincano/ng-dining` | Reservas de mesa: zonas, mesas, turnos, plano del día, asignación best-fit + combinación | theme · models | [README](../libs/shared/dining/README.md) |
| `@adrianmartincano/ng-menu` | Carta y menú del día (alérgenos, raciones, publicar/clonar) + selector de estilo tipográfico. Sin imágenes | theme · models | [README](../libs/shared/menu/README.md) |
| `@adrianmartincano/ng-cookies` | Banner RGPD, preferencias, política de cookies | theme | [README](../libs/shared/cookies/README.md) |
| `@adrianmartincano/ng-legal` | Política de privacidad y aviso legal generados | theme | [README](../libs/shared/legal/README.md) |
| `@adrianmartincano/ng-markdown` | Markdown reducido para texto del público: editor con barra de formato, emojis y vista previa + pipes de render | theme | [README](../libs/shared/markdown/README.md) |

### Composiciones (combinan varias librerías)

| Paquete | Qué incluye | Depende de | Documentación |
|---|---|---|---|
| `@adrianmartincano/ng-ecommerce` | Carrito, checkout 5 pasos, historial de pedidos | theme · products · forms · models | [README](../libs/shared/ecommerce/README.md) |
| `@adrianmartincano/ng-newsletter` | Formulario y popup de suscripción + panel admin de campañas | theme · ui · models | [README](../libs/shared/newsletter/README.md) |
| `@adrianmartincano/ng-cms` | Renderizador de páginas por bloques | theme · newsletter · models | [README](../libs/shared/cms/README.md) |
| `@adrianmartincano/ng-cms-editor` | Panel admin del CMS: builder visual + preview en vivo | theme · models · cms | [README](../libs/shared/cms-editor/README.md) |
| `@adrianmartincano/ng-blog` | Feed, detalle de post y comentarios (con formato markdown) + panel admin | theme · markdown | [README](../libs/shared/blog/README.md) |
| `@adrianmartincano/ng-forum` | Foro: categorías, hilos, mensajes con formato, reacciones, citas, moderación | theme · markdown | [README](../libs/shared/forum/README.md) |
| `@adrianmartincano/ng-events` | Webs de eventos (bodas, cumpleaños…) desde una sola config: catálogo de tipos, preset de tema en runtime, **reveal progresivo** por fecha y RSVP | theme · cms · models | [README](../libs/shared/events/README.md) |

> En GitHub Packages, el README de cada paquete se muestra en la página del paquete, así que esta documentación acompaña a cada versión publicada.
