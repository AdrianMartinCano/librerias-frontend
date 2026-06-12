# @adrianmartincano/ng-cms

Renderizador de páginas CMS para Angular: lib-cms-page pinta una página completa a partir de bloques JSON (hero, galería, FAQ, precios, CTA, newsletter...). El contenido se edita sin tocar código — ideal para que el cliente final gestione su web.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-cms
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |
| `@adrianmartincano/ng-newsletter` | `>=0.3.0` |

---

> Asegúrate de tener cargado el theme en tu `styles.css` global — los componentes usan sus variables CSS:
>
> ```css
> @import '@adrianmartincano/ng-theme/index.css';
> ```

---

## CMS (`@adrianmartincano/ng-cms`)

Constructor de páginas basado en bloques. Define una página como un array de objetos JSON y `<lib-cms-page>` la renderiza completa. El cliente puede editar los datos sin tocar el código.

```typescript
import { CmsPageComponent, CmsBlockComponent } from '@adrianmartincano/ng-cms';
import { CmsPage, CmsBlock, HeroData, FeaturesData, /* ... */ } from '@adrianmartincano/ng-models';
```

---

### `<lib-cms-page>` — Página completa

```html
<lib-cms-page [page]="miPagina" />
```

Renderiza todos los bloques de `page.blocks` en orden.

```typescript
readonly page: CmsPage = {
  slug:   'home',
  title:  'Página de inicio',
  blocks: [
    { type: 'hero',         data: { /* ... */ } },
    { type: 'features',     data: { /* ... */ } },
    { type: 'text-image',   data: { /* ... */ } },
    { type: 'testimonials', data: { /* ... */ } },
    { type: 'gallery',      data: { /* ... */ } },
    { type: 'pricing',      data: { /* ... */ } },
    { type: 'faq',          data: { /* ... */ } },
    { type: 'cta-banner',   data: { /* ... */ } },
    { type: 'text',         data: { /* ... */ } },
  ],
};
```

### `<lib-cms-block>` — Bloque individual

```html
<lib-cms-block [block]="unBloque" />
```

Para renderizar un bloque suelto sin página completa.

---

### Bloques disponibles

#### `hero` — Sección principal con imagen de fondo

```typescript
{ type: 'hero', data: {
  title:         'Título principal',
  subtitle:      'Subtítulo opcional',
  image:         'https://...jpg',       // imagen de fondo
  overlay:       true,                   // oscurece la imagen para contrastar
  align:         'center',              // 'left' | 'center'
  minHeight:     '70vh',                // altura mínima
  cta:           { label: 'Ver más', href: '/productos' },
  ctaSecondary:  { label: 'Sobre nosotros', href: '/nosotros' },
}}
```

#### `text-image` — Texto + imagen lado a lado

```typescript
{ type: 'text-image', data: {
  title:         'Nuestro compromiso',
  text:          'Descripción larga...',
  image:         'https://...jpg',
  imagePosition: 'right',               // 'left' | 'right'
  cta:           { label: 'Leer más', href: '/nosotros' },
}}
```

#### `features` — Grid de características con icono

```typescript
{ type: 'features', data: {
  title:    '¿Por qué elegirnos?',
  subtitle: 'Descripción opcional',
  cols:     3,                           // 2 | 3 | 4
  items: [
    { icon: '🌿', title: 'Calidad', text: 'Descripción...' },
  ],
}}
```

#### `gallery` — Galería con lightbox

```typescript
{ type: 'gallery', data: {
  title:  'Nuestros trabajos',
  cols:   3,                             // 2 | 3 | 4
  images: [
    { src: 'https://...jpg', alt: 'Descripción', caption: 'Pie opcional' },
  ],
}}
```

Clic en cualquier imagen abre el lightbox.

#### `cta-banner` — Franja de llamada a la acción

```typescript
{ type: 'cta-banner', data: {
  title:      '¿Listo para empezar?',
  subtitle:   'Texto opcional',
  background: 'accent',                  // 'accent' | 'primary' | 'surface'
  cta:        { label: 'Comprar', href: '/productos' },
  ctaSecondary: { label: 'Saber más', href: '/nosotros' },
}}
```

#### `faq` — Preguntas frecuentes con acordeón

```typescript
{ type: 'faq', data: {
  title: 'Preguntas frecuentes',
  items: [
    { question: '¿Cuánto tarda el envío?', answer: 'En 2-3 días laborables.' },
  ],
}}
```

Solo una pregunta abierta a la vez.

#### `testimonials` — Reseñas de clientes

```typescript
{ type: 'testimonials', data: {
  title: 'Nuestros clientes dicen',
  items: [
    { text: 'Excelente calidad.', author: 'Ana García', role: 'Cliente habitual', rating: 5 },
  ],
}}
```

`avatar` opcional (URL de imagen). Si no hay, muestra inicial del nombre con fondo accent.

#### `pricing` — Tabla de precios

```typescript
{ type: 'pricing', data: {
  title:    'Nuestros planes',
  subtitle: 'Sin permanencia',
  plans: [
    {
      name:        'Básico',
      price:       0,                    // number o string ('Gratis', 'Consultar')
      period:      'mes',
      description: 'Para empezar',
      features:    ['Feature 1', 'Feature 2'],
      cta:         { label: 'Empezar', href: '/registro' },
    },
    {
      name:        'Pro',
      price:       29,
      period:      'mes',
      features:    ['Todo lo anterior', 'Feature extra'],
      cta:         { label: 'Contratar', href: '/registro/pro' },
      highlighted: true,                 // borde accent + sombra
      badge:       'Más popular',        // etiqueta sobre la card
    },
  ],
}}
```

#### `text` — Contenido de texto/HTML

```typescript
{ type: 'text', data: {
  content: '<p>Texto con <strong>negritas</strong> y <a href="/link">enlaces</a>.</p>',
  align:   'center',                     // 'left' | 'center' | 'right'
}}
```

Soporta HTML básico: `<p>`, `<strong>`, `<em>`, `<a>`, `<br>`, `<h2>`, `<h3>`, `<ul>`, `<li>`.

#### `counters` — Cifras animadas

Contadores que se animan al entrar en pantalla. Para mostrar logros: clientes, años de experiencia, proyectos...

```typescript
{ type: 'counters', data: {
  title: 'Nuestros números',
  cols:  3,                              // 2 | 3 | 4 columnas
  items: [
    { value: 250, suffix: '+', label: 'Clientes satisfechos' },
    { value: 12,  label: 'Años de experiencia' },
    { value: 99,  suffix: '%', label: 'Valoraciones positivas' },
  ],
}}
```

`CounterItem`: `value` (número final), `label`, `prefix?` (`'€'`, `'$'`...), `suffix?` (`'+'`, `'k'`, `'%'`...).

#### `trust-badges` — Sellos de confianza

Fila de garantías con icono. Para reforzar la conversión: envíos, devoluciones, pago seguro...

```typescript
{ type: 'trust-badges', data: {
  align: 'center',                       // 'left' | 'center'
  items: [
    { icon: '🚚', text: 'Envío gratis desde 50 €' },
    { icon: '🔄', text: 'Devoluciones en 30 días' },
    { icon: '🔒', text: 'Pago 100 % seguro' },
  ],
}}
```

#### `newsletter` — Captación de suscriptores

Embebe el formulario de `@adrianmartincano/ng-newsletter` como bloque CMS (por eso esa librería es peer dependency). Requiere tener configurado `NewsletterService` (ver su README).

```typescript
{ type: 'newsletter', data: {
  title:       'Únete a nuestra comunidad',
  description: 'Novedades y ofertas, sin spam.',
  layout:      'inline',                 // 'inline' | 'stacked'
  source:      'cms-home',               // identificador del origen del alta
  background:  'surface',                // 'primary' | 'accent' | 'surface'
  align:       'center',                 // 'left' | 'center'
}}
```

---

### Añadir un bloque personalizado

```typescript
// 1. Define el tipo y los datos
type MyBlockType = CmsBlockType | 'video';
interface VideoData { url: string; title?: string; }

// 2. Crea el componente
@Component({ selector: 'lib-cms-video', template: `<iframe [src]="data().url">` })
export class VideoComponent { readonly data = input.required<VideoData>(); }

// 3. Extiende CmsBlockComponent con un nuevo @case
// O crea tu propio CmsBlockComponent con el bloque extra
```

---

