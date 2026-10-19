# Estado del proyecto

Última actualización: octubre 2026.

**20 librerías Angular** y **17 módulos Spring Boot**, publicados y usados en producción por varias
webs y aplicaciones. Este documento refleja el estado actual; la documentación de uso de cada
librería está en su README (ver [components.md](components.md)).

> **Sobre los tests:** cada cambio se verifica con tests unitarios **durante el desarrollo**. En el
> frontend los tests no se versionan (se ejecutan y, al pasar, se eliminan). En el backend hay una
> primera batería versionada (agosto 2026) sobre la lógica con más riesgo: pedidos, stock y estados.

---

## Novedades julio – octubre 2026

### Librerías nuevas

- **`ng-events` + `spring-events`** — webs de eventos (bodas, cumpleaños, bautizos, comuniones…)
  a partir de **una sola config**: catálogo de tipos de evento, **preset de tema** aplicado en
  runtime, **reveal progresivo** (cada sección aparece según la fecha, de *save the date* al día
  del evento) y confirmaciones de asistencia (**RSVP**) con resumen agregado para el organizador.
- **`ng-blog` / `spring-blog`**, **`ng-forum` / `spring-forum`** y **`ng-markdown`** — blog con
  comentarios, foro de comunidad completo (reacciones, citas, notificaciones, búsqueda, moderación)
  y un markdown reducido para el texto que escribe el público (se guarda en crudo, nunca HTML).
- **`ng-dining` / `spring-dining`** y **`ng-menu` / `spring-menu`** — reservas de mesa con
  asignación automática *best-fit* + combinación de mesas, y carta / menú del día.
- **`spring-google`** + botón en `ng-auth` — **entrar con Google** (Google Identity Services)
  dentro de la librería, en vez de copiado en cada web. Apagado por defecto.

### Mejoras

- **Cuentas (`ng-auth` / `spring-users`).** Recuperar la contraseña olvidada; ojo para ver la
  contraseña y campo de repetirla al registrarse; consentimiento extra opcional en el registro;
  el nick no se puede repetir por ninguna vía (tampoco entrando con Google, que ya no publica el
  nombre real); una cuenta dada de baja solo lo revela a quien acierta la contraseña.
- **Tienda (`ng-ecommerce` / `spring-ecommerce` / `spring-products`).** Opciones por línea de
  pedido (talla, color…) visibles en el carrito; reembolsos reales con **máquina de estados**
  validada; cancelar un pedido devuelve siempre su stock; caducidad de pedidos sin pagar; avisos de
  cambio de estado; punto de extensión para calcular el envío; un producto puede crearse sin
  publicar y estar en varias categorías.
- **`spring-storage`.** Subir un `.webp` ya no estropea la imagen al convertirla.
- **`spring-reservations`.** Arranca también con H2 (perfil local).
- **Publicación.** Los módulos a publicar salen del `<modules>` del POM padre (antes, una lista a
  mano que se olvidaba al añadir uno); el CI publica las 20 librerías y los 17 módulos y empuja solo
  el tag nuevo.

---

## Junio 2026 — endurecimiento, accesibilidad y multi-divisa

- **`ng-theme` como base formal del monorepo.** Convertido en proyecto Nx con `tags` por
  capa (`type:foundation` / `feature` / `composition`) e `implicitDependencies: ["theme"]` en
  todas las librerías y apps. Ahora `nx affected` reconstruye y testea las 14 al tocar la base.
  Detalle en el [README → Arquitectura](../README.md#arquitectura--capas-de-dependencia).
- **Design system pulido.** Sombras estratificadas, curvas de easing propias, anillo de foco
  accesible (`:focus-visible`), `color-scheme` claro/oscuro, `prefers-reduced-motion` y
  tipografía con `text-wrap`. Tokens nuevos documentados en el README de `ng-theme`.
- **Accesibilidad y rendimiento en `ng-ui`.** Navbar con listeners pasivos fuera de la zona de
  Angular (scroll/click ya no disparan change-detection); modal con focus-trap, cierre con
  `Escape` y restauración de foco; botón con `aria-busy`.
- **Higiene de dependencias.** `ng-models` declarado como `peerDependency` en las 8 librerías
  que lo importaban sin declararlo.
- **`ng-cms-editor` declara `ng-cms` como peer (0.5.4).** El receptor de preview importa
  `CmsPageComponent` de `ng-cms`, pero la peer no estaba en `publish.json`: un proyecto que
  instalaba solo `ng-cms-editor` compilaba con error. Lo destapó `pimon-generator`.
- **Lint del workspace en verde (16/16).** Migración a `inject()`, accesibilidad en plantillas,
  tipos en lugar de `any`, guardas en lugar de non-null assertions y limpieza de tests e2e.
- **Moneda configurable y multi-divisa.** `FormatService` (en `ng-models`, capa foundation)
  centraliza el formato de importes/fechas con `Intl` nativo (sin `registerLocaleData`). Se
  configura una vez con `provideLibFormat({ currencies, defaultCurrencyCode, dateLocale })`;
  cada moneda admite una `rate` opcional para **convertir** importes. Si hay más de una moneda,
  `lib-navbar` muestra un **selector** (independiente del de idioma) y todos los importes se
  actualizan al instante (reactivo, signals). Eliminada de paso la duplicación del antiguo
  `Intl.NumberFormat('es-ES', …)` repetido en 7 componentes. Default sin tocar nada:
  euros/`es-ES`. Ver [README → Formato e idioma](../README.md#formato-e-idioma).
- **Enganche de tasas con el backend.** `provideFxSync({ url })` carga las tasas de un endpoint
  al arrancar (best-effort). Su par backend es el nuevo módulo **`spring-fx`** (`/api/fx`), que
  sirve las tasas y puede refrescarlas en automático desde una API de cambio externa. Front y
  back ya están conectados de punta a punta.
- **`ng-forms` endurecido.** Accesibilidad real (aria-describedby para hint/error, `aria-invalid`,
  `role="alert"`, `fieldset`/`legend` en radios), el formulario se **reconstruye** si cambia el
  input `fields` (signals), y se eliminó el componente placeholder muerto.
- **`ng-auth` endurecido (seguridad).** El interceptor **deja de enviar el JWT a orígenes de
  terceros**: solo a rutas relativas, mismo origen y `trustedOrigins` configurables (nuevo en
  `AuthConfig`). Además: descarte de JWT caducado al arrancar (`isTokenExpired`), `JSON.parse`
  robusto, accesibilidad en el login (aria + `autocomplete` dinámico) y placeholder eliminado.
  ⚠️ *Si tu API es cross-origin, añade su origen a `trustedOrigins`.*
- **`ng-upload` mejorado.** Previews con `URL.createObjectURL` + `revokeObjectURL` (eficiente, sin
  fugas; fuera `FileReader`/`ChangeDetectorRef`); accesibilidad (drop zone con Enter/Espacio y
  `aria-disabled`, `progressbar` con aria, errores `role="alert"`) y placeholder eliminado.
- **CI a Node 24.** `actions/checkout@v6`, `setup-node@v6` (Node 24) y `setup-java@v5` — evita la
  deprecación de Node 20 en los runners.
- **`ng-cms` mejorado.** Acordeón FAQ con patrón ARIA completo (`aria-expanded`/`aria-controls`,
  panel `role="region"` + `aria-labelledby`, ids únicos por instancia, chevron `aria-hidden`) y
  placeholder eliminado.
- **`ng-cms-editor` endurecido.** Canal de preview por `postMessage` **seguro**: dirigido al origen
  del iframe (no `*`) y con validación del `source` en builder y receiver (no se filtra el contenido
  ni se aceptan mensajes de ventanas ajenas). Accesibilidad del block-editor (`aria-expanded` en el
  toggle, `aria-label` en subir/bajar/eliminar).
- **`ng-reservations` + funcionalidad nueva.** **Alta admin de X horas** (`lib-booking-admin`:
  calendario de cualquier día + servicio + hora + duración en horas → `BookingRequest` con
  `durationMinutes`) y **calendario público de solo lectura** (`lib-public-calendar`: ocupación sin
  datos del cliente). El calendario base gana `mode` (`available`/`all`/`readonly`) y `busyDates`.
  Backend (`spring-reservations`): `durationMinutes` en la reserva + endpoint público `GET /api/busy`.
- **Calendario de reservas personalizable + panel admin rediseñado.** El calendario
  (`lib-booking-calendar` / `lib-public-calendar`) se re-estila **sin tocar el componente** con
  variables CSS del theme (`--cal-day-radius`, `--cal-selected-bg`, `--cal-busy-bg`…); sus colores ya
  siguen la marca por defecto. El panel de gestión (`lib-booking-admin`) se reorganizó (calendario a la
  izquierda, formulario + reservas del día a la derecha, exportar/importar abajo) y el calendario tiene
  un look de agenda (hoy con anillo, día seleccionado en bloque de acento). Ver
  [README de `ng-theme` → Calendario de reservas](../libs/shared/theme/README.md).
- **Configuración editable en caliente (back + front).** Nueva tabla `app_settings` (una fila JSON por
  módulo) + `SettingsStore` cacheado en `spring-common`: el administrador edita ajustes de negocio desde
  el panel **sin reiniciar**, mientras `application.yml` queda solo para secretos/arranque (defaults).
  Aplicado **solo a `reservations`** (donde el dueño cambia cosas a menudo): **horario por día con
  turnos partidos** (mañana/tarde), intervalo, capacidad y **vacaciones/días cerrados** →
  `lib-reservations-settings` + `GET/PUT /api/admin/reservations/settings`.
  *(El mecanismo es genérico; se decidió no extenderlo al resto de módulos por bajo ROI.)*
- **`ng-reservations` — integración con calendarios (`.ics`, sin OAuth).** El panel admin gana
  **exportar** (por reserva → Google/Outlook/`.ics`; o todas en un `.ics`) e **importar** un `.ics` de
  cualquier app (Google/Apple/Outlook) → previsualiza y crea reservas **omitiendo solapamientos**. Nuevo
  output `imported` y utilidades reutilizables `buildIcs`/`parseIcs`/`googleCalendarUrl`/`outlookCalendarUrl`.
  Basado en el estándar iCalendar (RFC 5545), todo en frontend. *(El sync OAuth bidireccional con Google
  queda planificado para cuando un cliente lo pida.)*
- **Bloque CMS `calendar` (desacoplado).** El calendario público se puede embeber en cualquier página
  del CMS, pero **`ng-cms` NO depende de `ng-reservations`**: el dispatcher (`lib-cms-block`) admite
  bloques personalizados vía `provideCmsBlocks({ calendar: CalendarBlockComponent })` y `NgComponentOutlet`.
  El bloque `calendar` (`CalendarBlockComponent`, consulta `/api/busy` → `lib-public-calendar`) **vive en
  `ng-reservations`** y es **opt-in**: solo quien lo registra instala reservations. El `calendar-form`
  (editar la config del bloque) sigue en `ng-cms-editor`, sin acoplar.
- **`ng-products` mejorado.** Accesibilidad (tarjeta con Enter/Espacio, rating con `aria-label` y
  estrellas decorativas, controles del grid con `aria-label`, contador `aria-live`), guard en
  `CartService.add` (ignora cantidades ≤ 0) y placeholder eliminado.
- **`ng-ecommerce` mejorado.** Accesibilidad del checkout: indicador de pasos como `<ol>` con
  `aria-current="step"`, métodos de pago como `role="radiogroup"`, SVGs decorativos `aria-hidden`.
  Placeholder eliminado.
- **`ng-legal` afinado (coherencia legal + a11y).** Corregida una **incoherencia real**: el enlace a
  la autoridad de control estaba fijado a `aepd.es` aunque cambiaras `supervisoryAuthority` (p. ej. a
  otro país) — ahora se configura con `supervisoryAuthorityUrl` (por defecto AEPD). Enlaces de las
  páginas legales con estilo propio y `:focus-visible`, externos con `rel="noopener noreferrer"` y aviso
  "(abre en una pestaña nueva)" para lectores de pantalla, y `article` con `aria-labelledby` al `h1`.
- **`ng-newsletter` endurecido (DI + SSR + a11y).** Configuración idiomática por DI con
  `provideNewsletter({ apiUrl, subscribeEndpoint, ... })` (sigue válido `configure()` en runtime).
  `NewsletterService` **SSR-safe** (no toca `localStorage` en servidor; el popup no aparece hasta
  hidratar). Formulario accesible: **ids únicos por instancia** (evita IDs duplicados con varios
  formularios en la página), `aria-invalid`, `aria-describedby` al error, y anuncios `role="alert"`
  (error) / `role="status"` (éxito). Popup con **gestión de foco** (mueve el foco al diálogo y lo
  devuelve al cerrar), **`Escape` para cerrar**, **focus-trap** del `Tab`, y limpieza de los `setTimeout`
  al destruir. `:focus-visible` en los controles.
- **`ng-cookies` endurecido (RGPD + SSR + a11y).** `CookieService` ahora es **SSR-safe** (no toca
  `localStorage` en servidor) y el consentimiento **caduca y se versiona**: con `provideCookieConsent`
  configuras `version` (al subirla se re-pregunta a todos) y `expiresAfterDays` (por defecto 180; el
  RGPD desaconseja consentimientos "para siempre"). Corregido un bug en el banner (`[href]` enlazaba
  la función signal en vez de su valor). Accesibilidad: `aria-labelledby/-describedby` en el banner
  (sin `aria-modal` engañoso al no haber focus-trap), `role="switch"` en el toggle de necesarias y
  `:focus-visible` en todos los controles. Inyección muerta eliminada en `lib-cookie-policy`.

---

## Frontend Angular — 20 librerías (npm)

**Versión actual: `0.5.4`** (todas a la vez) · scope `@adrianmartincano`

| Capa | Paquetes |
|---|---|
| Fundamentos | `ng-theme`, `ng-models` |
| Features | `ng-ui`, `ng-forms`, `ng-auth`, `ng-upload`, `ng-products`, `ng-reservations`, `ng-dining`, `ng-menu`, `ng-cookies`, `ng-legal`, `ng-markdown` |
| Composiciones | `ng-ecommerce`, `ng-newsletter`, `ng-cms`, `ng-cms-editor`, `ng-blog`, `ng-forum`, `ng-events` |

Qué incluye cada una: [README raíz](../README.md#librerías) y [components.md](components.md).

---

## Backend Spring Boot — 17 módulos (Maven)

**Versión actual: `0.12.5`** · groupId `io.github.adrianmartincano`

| Grupo | Módulos |
|---|---|
| Base | `spring-common`, `spring-security`, `spring-users`, `spring-google` |
| Contenido | `spring-cms`, `spring-blog`, `spring-forum`, `spring-storage` |
| Comercio | `spring-products`, `spring-ecommerce`, `spring-fx` |
| Reservas y restauración | `spring-reservations`, `spring-dining`, `spring-menu` |
| Comunicación y eventos | `spring-emails`, `spring-newsletter`, `spring-events` |

Detalle de cada módulo: [`docs/backend.md`](https://github.com/AdrianMartinCano/libreriasBackend/blob/main/docs/backend.md).

---

## Cómo se publica (CI)

Cada repo tiene su `publish.ps1`: sube la versión de **todos** los paquetes a la vez, crea el tag
`v*` y GitHub Actions publica.

```powershell
.\publish.ps1 patch -CI    # 0.5.4 → 0.5.5: commit + tag + push, el CI publica
```

GitHub Packages no permite sobrescribir una versión: cada publicación necesita una nueva.

---

## Dónde se usan

| Tipo de proyecto | Front | Back |
|---|---|---|
| Tienda + blog + foro (editorial) | 14 librerías | 11 módulos |
| Tienda de impresión 3D | auth, upload, markdown… | ecommerce, products, storage, google… |
| App de gastos (PWA) | auth | users, security, google |
| Web de evento | events, cms | events |
| App interna de gestión | — | common, security, users |
| `apps/demo` (este repo) | workspace local | — |

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

### Próximas librerías

- **`ng-map`** — mapa configurable (marcador del negocio, área de cobertura, dirección).
- **`spring-coupons`** — cupones de descuento (porcentaje o importe, caducidad, límite de usos).
