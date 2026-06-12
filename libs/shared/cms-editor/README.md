# @adrianmartincano/ng-cms-editor

Panel de administración del CMS: gestor de páginas (`lib-cms-pages-manager`), constructor visual de bloques (`lib-cms-page-builder`) con previsualización en vivo, y formularios específicos para cada tipo de bloque (hero, galería, FAQ, precios...). Es la contraparte de edición de `@adrianmartincano/ng-cms` (que solo renderiza).

> **Importante:** esta librería se usa en la zona de administración de la web (detrás de login). El visitante normal nunca la carga.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-cms-editor
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@angular/forms` | `>=21.0.0` |
| `@adrianmartincano/ng-models` | `>=0.0.1` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |

Necesita `provideHttpClient()` en `app.config.ts` (usa `HttpClient` para hablar con la API).

---

## Uso — montar el panel de administración

**1. Página de gestión de páginas** (lista, crear, publicar/despublicar, borrar):

```typescript
import { Component } from '@angular/core';
import { CmsPagesManagerComponent } from '@adrianmartincano/ng-cms-editor';

@Component({
  standalone: true,
  imports: [CmsPagesManagerComponent],
  template: `<lib-cms-pages-manager previewPath="/cms-preview" />`,
})
export class AdminCmsPage {}
```

**2. Página de previsualización** (la abre el builder en un iframe para ver los cambios en vivo):

```typescript
import { Component } from '@angular/core';
import { CmsPreviewReceiverComponent } from '@adrianmartincano/ng-cms-editor';

@Component({
  standalone: true,
  imports: [CmsPreviewReceiverComponent],
  template: `<lib-cms-preview-receiver />`,
})
export class CmsPreviewPage {}
```

**3. Rutas** (protege la de admin con tu guard de autenticación):

```typescript
// app.routes.ts
{ path: 'admin/cms', component: AdminCmsPage, canActivate: [authGuard] },
{ path: 'cms-preview', component: CmsPreviewPage },
```

Con esto el administrador puede crear páginas, añadir/ordenar/editar bloques con formularios guiados y ver el resultado en tiempo real antes de publicar.

---

## Componentes

### `lib-cms-pages-manager`

Pantalla principal del admin: tabla con todas las páginas del CMS, crear nueva, editar (abre el builder), publicar/despublicar y eliminar.

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `previewPath` | `string` | `'/cms-preview'` | Ruta de tu app donde está montado `lib-cms-preview-receiver`. |

### `lib-cms-page-builder`

Editor de una página concreta: añadir bloques de cualquier tipo, reordenarlos, editarlos con el formulario correspondiente y guardar. Incluye panel de previsualización en vivo (iframe que apunta a `previewPath`).

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `previewPath` | `string` | `'/cms-preview'` | Ruta de la página de previsualización. |

### `lib-cms-preview-receiver`

Recibe por `postMessage` los bloques que se están editando y los renderiza con `lib-cms-page`. Se monta en una ruta pública de la app, sin navbar ni footer idealmente.

### `lib-block-editor` y formularios de bloque

`lib-block-editor` elige automáticamente el formulario adecuado según el tipo de bloque. Los formularios individuales (`HeroFormComponent`, `GalleryFormComponent`, `FaqFormComponent`, `PricingFormComponent`, `TestimonialsFormComponent`, `CountersFormComponent`, `TrustBadgesFormComponent`, `CtaBannerFormComponent`, `TextFormComponent`, `TextImageFormComponent`, `FeaturesFormComponent`) también se exportan por si quieres montarlos a tu manera.

---

## `CmsAdminService`

Cliente HTTP del API de administración (`/api/admin/cms/pages`, el contrato que implementa el módulo Spring `spring-cms`):

| Método | Descripción |
|---|---|
| `list()` | Lista de páginas (resumen). |
| `get(id)` | Detalle de una página con sus bloques. |
| `create(req)` | Crea una página. |
| `update(id, req)` | Actualiza título, slug y bloques. |
| `togglePublished(id)` | Publica/despublica. |
| `delete(id)` | Elimina la página. |

> Las llamadas van contra el mismo dominio del frontend. Si tu API vive en otro dominio, usa un interceptor que anteponga la URL base, o un proxy.

---

## Estilos

Usa las variables del theme (`@adrianmartincano/ng-theme`). Asegúrate de tenerlo importado en tu `styles.css` global:

```css
@import '@adrianmartincano/ng-theme/index.css';
```
