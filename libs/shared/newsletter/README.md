# @adrianmartincano/ng-newsletter

Captación de suscriptores de email: formulario embebible (`lib-newsletter-form`), popup con temporizador (`lib-newsletter-popup`) y panel de administración de campañas (`lib-newsletter-admin`). No depende de Brevo, Mailchimp ni de ningún proveedor externo — las suscripciones se envían al backend del propio negocio.

---

## Instalación

```bash
npm install @adrianmartincano/ng-newsletter
```

**Peer dependencies:**

| Paquete | Versión |
|---|---|
| `@angular/core` | `>=21.0.0` |
| `@angular/common` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |

> Asegúrate de tener cargado el theme (`@adrianmartincano/ng-theme`) — los componentes usan sus variables CSS y las clases utilitarias `.lib-input`, `.lib-label`, `.lib-field-error` y `.lib-spinner`.

### Requisito: HttpClient

`NewsletterService` usa `HttpClient` internamente, así que la app debe tener registrado el cliente HTTP:

```typescript
// app.config.ts
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // ...resto de providers
  ],
};
```

---

## Configuración — tu propio dominio

Por defecto, las suscripciones se envían a `/api/newsletter/subscribe` en el **mismo dominio** que el frontend (ideal cuando frontend y backend están detrás del mismo proxy). Si tu API vive en otro dominio (p. ej. `api.tudominio.com`), configúralo una vez al arrancar la app:

```typescript
// app.ts (o app.config.ts)
import { inject } from '@angular/core';
import { NewsletterService } from '@adrianmartincano/ng-newsletter';
import { environment } from '../environments/environment';

export class App {
  constructor() {
    inject(NewsletterService).configure({
      apiUrl: environment.apiUrl, // p. ej. 'https://api.tudominio.com'
    });
  }
}
```

### `NewsletterConfig`

| Propiedad | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `apiUrl` | `string` | `''` | Dominio base de tu API. Vacío = misma URL que el frontend. |
| `subscribeEndpoint` | `string` | `'/api/newsletter/subscribe'` | Ruta del endpoint de alta. |
| `popupDismissKey` | `string` | `'newsletter_popup_dismissed'` | Clave de `localStorage` para recordar que el popup ya se cerró. |
| `popupDismissTtlDays` | `number` | `30` | Días que el popup permanece oculto tras cerrarse antes de volver a aparecer. |

### Contrato de la API

`NewsletterService.subscribe(email, source)` hace:

```http
POST {apiUrl}{subscribeEndpoint}
Content-Type: application/json

{ "email": "persona@ejemplo.com", "source": "popup-girandomadera" }
```

Respuesta esperada (`NewsletterSubscribeResponse`):

```typescript
{
  success: boolean;
  message?: string;
  alreadySubscribed?: boolean;
}
```

> El endpoint puede ser cualquier API propia que cumpla este contrato (Spring Boot, Express, una función serverless...). En el stack Spring Boot lo implementa el módulo **`io.github.adrianmartincano:spring-newsletter`**, que además aporta doble opt-in (email de confirmación), baja por enlace y envío de campañas.

---

## `NewsletterService`

**Métodos públicos** (no requieren autenticación):

| Método | Descripción |
|---|---|
| `configure(config: NewsletterConfig)` | Aplica la configuración (dominio, endpoint, clave de localStorage). Llamar una vez al arrancar la app. |
| `subscribe(email: string, source?: string)` | Envía el alta a la API. Devuelve `Observable<NewsletterSubscribeResponse>`. `source` identifica de dónde viene la suscripción (`'footer'`, `'popup'`, `'blog'`...). |
| `isPopupDismissed()` | `true` si el usuario ya cerró el popup anteriormente (persistido en `localStorage`, con TTL). |
| `dismissPopup()` | Marca el popup como descartado para no volver a mostrarlo durante `popupDismissTtlDays`. |

**Métodos de administración** (contra `/api/admin/newsletter/**`, requieren JWT con rol ADMIN — usa `authInterceptor` de `@adrianmartincano/ng-auth`):

| Método | Descripción |
|---|---|
| `listSubscribers(status?, page?, size?)` | Lista paginada de suscriptores. `status`: `'pending' \| 'confirmed' \| 'unsubscribed'`. |
| `exportSubscribersCsv(status?)` | Devuelve el CSV de suscriptores como `string`. |
| `listCampaignTemplates()` | Catálogo de plantillas de campaña (`NewsletterCampaignTemplate[]`) que ofrece el backend. |
| `previewCampaign(subject, body, templateId?)` | Renderiza el HTML exacto de la campaña sin enviarla (`NewsletterCampaignPreview`). |
| `sendCampaign(subject, body, templateId?)` | Envía la campaña a todos los suscriptores confirmados. |
| `listCampaigns(page?, size?)` | Historial de campañas enviadas (`NewsletterCampaign`). |

---

## `lib-newsletter-form`

Formulario de suscripción con validación de email, estado de carga y mensajes de éxito/error. Pensado para usarse como sección del CMS, en el footer o en cualquier página.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `title` | `string` | `''` | Título opcional sobre el formulario. |
| `description` | `string` | `''` | Texto descriptivo bajo el título. |
| `placeholder` | `string` | `'tu@email.com'` | Placeholder del campo de email. |
| `submitLabel` | `string` | `'Suscribirme'` | Texto del botón. |
| `successMessage` | `string` | `'¡Listo! Revisa tu email para confirmar la suscripción.'` | Mensaje mostrado tras una suscripción correcta. |
| `errorMessage` | `string` | `'No se ha podido completar la suscripción. Inténtalo de nuevo.'` | Mensaje mostrado si la API devuelve error. |
| `layout` | `NewsletterFormLayout` (`'inline' \| 'stacked'`) | `'inline'` | `inline`: campo y botón en la misma fila (desktop). `stacked`: campo y botón apilados verticalmente. |
| `source` | `string` | `''` | Identificador del origen de la suscripción, se envía a la API (`'footer'`, `'home'`, `'popup'`...). |

### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `subscribed` | `string` (email) | Se emite cuando la suscripción se completa correctamente. |

### Ejemplos

**Sección embebida (layout `inline`, por defecto):**

```html
<lib-newsletter-form
  title="Únete a nuestra comunidad"
  description="Recibe novedades, ofertas y consejos directamente en tu email."
  source="home"
/>
```

**En el footer (layout `stacked`, columna estrecha):**

```html
<lib-newsletter-form
  layout="stacked"
  title="Newsletter"
  submitLabel="Apuntarme"
  source="footer"
/>
```

**Reaccionar al evento `subscribed`:**

```html
<lib-newsletter-form
  source="blog"
  (subscribed)="onSuscrito($event)"
/>
```

```typescript
onSuscrito(email: string): void {
  console.log('Nuevo suscriptor:', email);
}
```

---

## `lib-newsletter-popup`

Popup flotante (esquina inferior derecha) que aparece tras un retardo configurable, embebe `lib-newsletter-form` en layout `stacked` y se recuerda en `localStorage` para no volver a mostrarse tras cerrarse o tras una suscripción correcta. Colócalo una vez en el componente raíz (`app.html`) para que aparezca en todo el sitio.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `delay` | `number` | `8000` | Milisegundos de espera antes de mostrar el popup. |
| `title` | `string` | `'No te pierdas nuestras novedades'` | Título del popup. |
| `description` | `string` | `'Suscríbete y recibe ofertas y noticias en tu email.'` | Texto descriptivo. |
| `submitLabel` | `string` | `'Suscribirme'` | Texto del botón. |
| `successMessage` | `string` | `'¡Gracias! Ya estás suscrito.'` | Mensaje mostrado tras suscribirse. |
| `source` | `string` | `'popup'` | Identificador del origen, se envía a la API. |

### Comportamiento

- No se muestra si el usuario ya lo cerró antes (`NewsletterService.isPopupDismissed()`).
- Al cerrarlo (botón ✕ o clic fuera) o al suscribirse correctamente, se marca como descartado (`dismissPopup()`) y no volverá a aparecer en ese navegador.
- Tras una suscripción correcta, se cierra automáticamente a los 2,5 s mostrando antes el mensaje de éxito.

### Ejemplo

```html
<!-- app.html, una sola vez para todo el sitio -->
<lib-newsletter-popup
  title="¡No te pierdas nuestras novedades!"
  description="Suscríbete y recibe ofertas exclusivas en tu email."
  [delay]="6000"
  source="popup-sitio"
/>
```

---

## `lib-newsletter-admin`

Panel de administración completo, pensado para una página protegida con `authGuard` + rol ADMIN. Incluye:

- **Suscriptores**: tabla paginada con filtro por estado (`pending` / `confirmed` / `unsubscribed`) y exportación a CSV.
- **Campañas**: redactor con asunto y cuerpo, **selector de plantilla** (las que ofrezca el backend), **previsualización en vivo** del HTML exacto que se enviará (iframe) y botón de envío a todos los confirmados.
- **Historial**: campañas enviadas con fecha y nº de destinatarios.

No tiene inputs — toda la configuración sale de `NewsletterService.configure()`.

```typescript
import { Component } from '@angular/core';
import { NewsletterAdminComponent } from '@adrianmartincano/ng-newsletter';

@Component({
  standalone: true,
  imports: [NewsletterAdminComponent],
  template: `<lib-newsletter-admin />`,
})
export class AdminNewsletterPage {}
```

```typescript
// app.routes.ts
{ path: 'admin/newsletter', component: AdminNewsletterPage, canActivate: [authGuard] },
```

> Las llamadas admin necesitan el header `Authorization: Bearer <jwt>` — registra el `authInterceptor` de `@adrianmartincano/ng-auth` (o uno propio).

---

## Tipos exportados

`NewsletterConfig`, `NewsletterSubscribeResponse`, `NewsletterFormLayout`, `NewsletterFormStatus`, `NewsletterSubscriberStatus`, `NewsletterSubscriberAdmin`, `NewsletterCampaign`, `NewsletterCampaignTemplate`, `NewsletterCampaignPreview`, `NewsletterPage<T>` (página genérica), `NewsletterApiResponse<T>` (envoltorio `{ success, data, message }`).

---

## Estilos

Los componentes usan las variables CSS del design system (`@adrianmartincano/ng-theme`): `--color-accent`, `--color-success`, `--color-text`, `--color-surface`, `--space-*`, `--radius-md`, `--shadow-xl`, `--z-modal` y las animaciones `lib-fade-in` / `lib-slide-up`. El campo de email y los mensajes de validación reutilizan las clases utilitarias globales `.lib-input`, `.lib-label` y `.lib-field-error`; el spinner de carga usa `.lib-spinner`. No es necesario importar CSS adicional más allá del theme.
