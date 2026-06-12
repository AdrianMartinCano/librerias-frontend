# Estado del proyecto

Última actualización: junio 2026.

Las librerías frontend (Angular) y backend (Spring Boot) están **completas y publicadas**. Este documento refleja el estado actual; la documentación de uso de cada librería está en su README (ver [components.md](components.md)).

---

## Frontend Angular — publicado en GitHub Packages (npm)

**Versión actual: `0.3.8`** — repositorio: `AdrianMartinCano/librerias` · scope `@adrianmartincano`

| Paquete | Qué incluye |
|---|---|
| `@adrianmartincano/ng-theme` | Design system CSS: paleta 4 colores, modo oscuro, grid, animaciones |
| `@adrianmartincano/ng-models` | Interfaces y tipos compartidos |
| `@adrianmartincano/ng-ui` | Tabla, navbar, footer, botón, card, modal, loader, skeleton, toasts |
| `@adrianmartincano/ng-forms` | Formulario dinámico con validación |
| `@adrianmartincano/ng-auth` | Login/registro, JWT, guards, interceptor, social providers |
| `@adrianmartincano/ng-upload` | Drag & drop, preview, validación, progreso |
| `@adrianmartincano/ng-products` | Catálogo, tarjeta, grid con filtros, CartService |
| `@adrianmartincano/ng-ecommerce` | Carrito editable, checkout 5 pasos, historial de pedidos |
| `@adrianmartincano/ng-cms` | Renderizador de páginas: 12 tipos de bloque |
| `@adrianmartincano/ng-cms-editor` | Panel admin del CMS: builder + preview en vivo |
| `@adrianmartincano/ng-reservations` | Calendario, slots de hora, formulario multi-paso |
| `@adrianmartincano/ng-cookies` | Consentimiento RGPD: banner, preferencias, política |
| `@adrianmartincano/ng-legal` | Política de privacidad y aviso legal configurables |
| `@adrianmartincano/ng-newsletter` | Formulario/popup de suscripción + admin de campañas |

**14/14 publicadas.**

---

## Backend Spring Boot — publicado en GitHub Packages (Maven)

**Versión actual: `1.1.12`** — repositorio: `AdrianMartinCano/librerias-backend` · groupId `io.github.adrianmartincano`

| Artefacto | Qué incluye |
|---|---|
| `spring-common` | ApiResponse, AppException, GlobalExceptionHandler, clases base |
| `spring-security` | JWT, Spring Security, rutas públicas configurables, CORS |
| `spring-users` | Usuarios, roles, admin por defecto |
| `spring-products` | CRUD catálogo, categorías, filtros, paginación |
| `spring-ecommerce` | Pedidos, checkout, Stripe opcional |
| `spring-storage` | Subida de archivos local/S3, conversión WebP |
| `spring-cms` | API de páginas y bloques (pública + admin) |
| `spring-reservations` | Reservas, disponibilidad, horarios |
| `spring-emails` | Envío SMTP, plantillas Thymeleaf con marca configurable |
| `spring-newsletter` | Suscripciones doble opt-in, campañas con plantillas, confirm/unsubscribe con redirección |

**10/10 publicados.**

---

## Cómo se publica (CI)

Ambos repos publican por GitHub Actions al pushear un tag `v*`:

```bash
# Front (publica los 14 paquetes npm)
git tag v0.3.9 && git push && git push --tags

# Back (publica los 10 artefactos Maven)
git tag v1.1.13 && git push && git push --tags
```

Antes de taggear: subir la versión en los 14 `libs/shared/*/publish.json` (front) o en el `pom.xml` raíz + los 10 `<parent><version>` de los módulos (back).

---

## Proyectos que las consumen

| Proyecto | Front | Back |
|---|---|---|
| **girandomadera** (`F:\girandomadera`) | 14 paquetes `^0.3.x` | `girandoMaderaBack` con módulos `1.1.x` |
| **errestattoo** (cliente Sandra Erres) | planificado | planificado |
| **demo** (`apps/demo`, solo local) | workspace local | — |

---

## Posibles mejoras futuras

### Deuda menor — hacer cuando se vuelva a tocar el módulo

- **Snapshot de campañas en `NewsletterCampaign`** (`spring-newsletter`): añadir dos columnas al enviar:
  - `renderedHtml` — el HTML canónico enviado (con el enlace de baja en placeholder, como el preview).
    Es la foto fiel del historial: sobrevive a renombrados de plantillas y a cambios de marca
    (`pimon.email.primary-color`, logo...). Sin esto, una campaña antigua no se puede reproducir.
  - `templateId` (nullable) — solo para un futuro botón "duplicar campaña" (precargar el redactor
    con asunto + cuerpo + plantilla). Si la plantilla ya no existe en el catálogo, fallback a
    "sin plantilla" con aviso. No sirve para el historial (el render de hoy ≠ el de entonces).

### Solo si un cliente lo pide

- Campañas programadas (envío diferido) en `spring-newsletter` — requiere scheduler, estados
  borrador/programada/enviada y UI de cancelación. Coste alto para demanda no validada.

### Otras ideas

- Más bloques CMS (vídeo, mapa, formulario de contacto embebido).
- Tests e2e de los flujos completos (checkout, reservas) en `apps/demo-e2e`.

> Las **siguientes librerías** a construir y su priorización (utilidad × dificultad) están en
> `infraestructura/negocio/roadmap-librerias.md`. Resumen: `ng-map` y `spring-coupons` primero
> (ya figuran en la tarifa como módulos contratables sin existir aún), después blog y reseñas.
