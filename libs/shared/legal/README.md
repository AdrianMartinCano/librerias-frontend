# @adrianmartincano/ng-legal

Páginas legales listas para usar: política de privacidad (`lib-privacy-policy`) y aviso legal (`lib-legal-notice`) conforme a RGPD/LSSI. Rellenas los datos de tu negocio una vez (`LegalConfig`) y los textos se generan solos. Cualquier sección se puede sobrescribir con tu propio contenido.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-legal
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

## Uso en 3 pasos

**1. Define los datos de tu negocio una sola vez:**

```typescript
// src/app/config/legal.config.ts
import { LegalConfig } from '@adrianmartincano/ng-legal';

export const MI_NEGOCIO_LEGAL: LegalConfig = {
  businessName: 'Peluquería García S.L.',
  nif: 'B12345678',
  address: 'Calle Mayor 1, 28001 Madrid',
  contactEmail: 'info@peluqueriagarcia.com',
  domain: 'peluqueriagarcia.com',
  activity: 'peluquería y estética',
};
```

**2. Crea las dos páginas:**

```typescript
// privacy-policy.page.ts
import { Component } from '@angular/core';
import { PrivacyPolicyComponent } from '@adrianmartincano/ng-legal';
import { MI_NEGOCIO_LEGAL } from '../config/legal.config';

@Component({
  standalone: true,
  imports: [PrivacyPolicyComponent],
  template: `<lib-privacy-policy [cfg]="legal" />`,
})
export class PrivacyPolicyPage {
  readonly legal = MI_NEGOCIO_LEGAL;
}
```

```typescript
// legal-notice.page.ts — igual pero con LegalNoticeComponent
template: `<lib-legal-notice [cfg]="legal" />`
```

**3. Enrútalas y enlázalas en el footer:**

```typescript
// app.routes.ts
{ path: 'privacidad', component: PrivacyPolicyPage },
{ path: 'aviso-legal', component: LegalNoticePage },
```

---

## `LegalConfig`

| Propiedad | Obligatoria | Descripción |
|---|---|---|
| `businessName` | ✅ | Nombre del negocio o autónomo: `"Peluquería García S.L."` / `"María García López"` |
| `nif` | ✅ | NIF / CIF |
| `address` | ✅ | Dirección fiscal completa |
| `contactEmail` | ✅ | Email de contacto para ejercer derechos RGPD |
| `domain` | ✅ | Dominio web sin protocolo: `"minegocio.com"` |
| `activity` | ✅ | Actividad: `"peluquería"`, `"tienda de muebles"`, `"clínica dental"`... |
| `country` | — | País de establecimiento (por defecto: España) |
| `supervisoryAuthority` | — | Autoridad de control (por defecto: AEPD) |
| `customSections` | — | HTML propio para sustituir secciones completas (ver abajo) |

---

## Componentes

### `lib-privacy-policy`

Política de privacidad con las secciones: responsable, finalidad, base jurídica, destinatarios, transferencias internacionales, conservación, derechos del usuario y cookies.

### `lib-legal-notice`

Aviso legal con las secciones: datos identificativos, objeto, propiedad intelectual, responsabilidad y ley aplicable.

**Inputs comunes:**

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `cfg` | `LegalConfig` | — (obligatorio) | Datos del negocio. |
| `lastUpdated` | `string` | fecha actual | Fecha de "última actualización". |

---

## Personalizar una sección

Si el texto genérico de alguna sección no encaja con tu caso, sobrescríbela con `customSections` (incluye el `<h2>`):

```typescript
export const MI_NEGOCIO_LEGAL: LegalConfig = {
  // ...datos básicos...
  customSections: {
    finalidad: `
      <h2>Finalidad del tratamiento</h2>
      <p>Tus datos se usan exclusivamente para gestionar tus reservas
      y enviarte recordatorios de cita.</p>
    `,
  },
};
```

Claves disponibles — `lib-privacy-policy` (tipo `PrivacySection`): `responsable` · `finalidad` · `baseJuridica` · `destinatarios` · `transferencias` · `conservacion` · `derechos` · `cookies`. `lib-legal-notice` (tipo `LegalSection`): `identificativos` · `objeto` · `propiedadIntelectual` · `responsabilidad` · `leyAplicable`.

> ⚠️ Estos textos genéricos son una base razonable para negocios pequeños, pero no sustituyen el asesoramiento de un profesional legal.
