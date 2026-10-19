# @adrianmartincano/ng-cookies

Gestión de consentimiento de cookies conforme a RGPD: banner de aviso (`lib-cookie-banner`), panel de preferencias por categoría (`lib-cookie-settings`), página de política de cookies (`lib-cookie-policy`) y `CookieService` para consultar el consentimiento desde tu código.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-cookies
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |

---

> Asegúrate de tener cargado el theme en tu `styles.css` global — los componentes usan sus variables CSS:
>
> ```css
> @import '@adrianmartincano/ng-theme/index.css';
> ```

---

## Uso en 2 pasos

**1. Añade el banner una sola vez en `app.html`** (componente raíz). Aparecerá automáticamente en la primera visita y desaparecerá cuando el usuario decida:

```html
<lib-cookie-banner cookiePolicyPath="/politica-de-cookies" />
```

**2. Crea la página de política de cookies** y enlázala en el footer:

```typescript
import { Component } from '@angular/core';
import { CookiePolicyComponent } from '@adrianmartincano/ng-cookies';

@Component({
  selector: 'app-politica-cookies',
  standalone: true,
  imports: [CookiePolicyComponent],
  template: `<lib-cookie-policy />`,
})
export class PoliticaCookiesPage {}
```

```typescript
// app.routes.ts
{ path: 'politica-de-cookies', component: PoliticaCookiesPage },
```

Con esto ya cumples: banner en la primera visita, opciones de aceptar/rechazar/personalizar y página informativa.

---

## `lib-cookie-banner`

Banner fijo en la parte inferior con tres acciones: **Aceptar todo**, **Rechazar todo** y **Personalizar** (abre `lib-cookie-settings`). Solo se muestra si el usuario aún no ha decidido.

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `cookiePolicyPath` | `string` | `'/politica-de-cookies'` | Ruta a la página de política de cookies, enlazada desde el texto del banner. |

---

## `lib-cookie-settings`

Panel de preferencias por categoría (necesarias, análisis, marketing, preferencias). Lo abre el propio banner, pero también puedes usarlo suelto (p. ej. en una página "Configurar cookies" para que el usuario cambie de opinión más tarde).

| Output | Descripción |
|---|---|
| `saved` | El usuario guardó sus preferencias. |
| `cancelled` | El usuario cerró sin guardar. |

```html
<lib-cookie-settings (saved)="cerrar()" (cancelled)="cerrar()" />
```

---

## `lib-cookie-policy`

Página de política de cookies ya redactada (qué son, categorías usadas, cómo cambiar la configuración). Lista para enrutar.

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `lastUpdated` | `string` | fecha actual | Fecha de "última actualización" mostrada en la página. |

---

## `CookieService`

Para condicionar tu código al consentimiento (p. ej. cargar Google Analytics solo si hay permiso de análisis):

| Miembro | Tipo | Descripción |
|---|---|---|
| `decided` | `Signal<boolean>` | `true` si el usuario ya tomó una decisión. |
| `consent` | `Signal<CookieConsent \| null>` | Consentimiento completo (o `null` si aún no decidió). |
| `hasConsent(category)` | `boolean` | `true` si la categoría está permitida. Categorías: `'necessary'`, `'analytics'`, `'marketing'`, `'preferences'`. |
| `acceptAll()` / `rejectAll()` | `void` | Acepta o rechaza todas las categorías. |
| `saveCustom(prefs)` | `void` | Guarda una selección personalizada. |
| `reset()` | `void` | Borra la decisión (el banner volverá a salir). |

```typescript
import { inject } from '@angular/core';
import { CookieService } from '@adrianmartincano/ng-cookies';

export class AnalyticsLoader {
  private readonly cookies = inject(CookieService);

  cargarAnalytics(): void {
    if (this.cookies.hasConsent('analytics')) {
      // inyectar el script de Google Analytics
    }
  }
}
```

El consentimiento se persiste en `localStorage` (clave `pimon_cookie_consent`), así que la decisión se recuerda entre visitas. El servicio es **SSR-safe**: en servidor/prerender no toca `localStorage` (no decide nada hasta hidratar en el navegador).

---

## Configuración (`provideCookieConsent`)

Opcional. Controla cuándo se vuelve a pedir el consentimiento — recomendado por el RGPD para no
mantener un consentimiento "para siempre". Todo tiene valores por defecto sensatos.

```typescript
import { provideCookieConsent } from '@adrianmartincano/ng-cookies';

bootstrapApplication(App, {
  providers: [
    provideCookieConsent({
      version: 2,            // súbela al cambiar las categorías/política → re-pregunta a todos
      expiresAfterDays: 180, // vuelve a preguntar pasados N días (0 = nunca caduca)
      // storageKey: 'pimon_cookie_consent',
    }),
  ],
});
```

| Opción | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `version` | `number` | `1` | Versión de la política. Si la subes, los consentimientos anteriores se invalidan y el banner vuelve a salir. |
| `expiresAfterDays` | `number` | `180` | Días tras los que se vuelve a pedir consentimiento. `0` = nunca caduca. |
| `storageKey` | `string` | `'pimon_cookie_consent'` | Clave de `localStorage`. |
