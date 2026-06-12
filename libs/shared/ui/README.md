# @adrianmartincano/ng-ui

Componentes de interfaz reutilizables para Angular: tabla, navbar, footer, botón, card, modal, loader, skeleton y toasts. Incluye además ThemeService (modo claro/oscuro) e I18nService (idioma activo). Mobile-first y temable con variables CSS.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-ui
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

## Importar

| Selector | Clase a importar |
|---|---|
| `<lib-table>` | `TableComponent` |
| `<lib-navbar>` | `NavbarComponent` |
| `<lib-footer>` | `FooterComponent` |
| `<lib-button>` | `ButtonComponent` |
| `<lib-card>` | `CardComponent` |
| `<lib-modal>` | `ModalComponent` |
| `<lib-loader>` | `LoaderComponent` |
| `<lib-skeleton>` | `SkeletonComponent` |
| `<lib-toast-container>` | `ToastContainerComponent` |
| — (servicios) | `ToastService`, `ThemeService`, `I18nService` |

```typescript
import {
  TableComponent, NavbarComponent, FooterComponent, ButtonComponent, CardComponent,
  ModalComponent, LoaderComponent, SkeletonComponent, ToastContainerComponent,
  ToastService, ThemeService, I18nService,
} from '@adrianmartincano/ng-ui';
import { Column, NavItem, FooterSection, SocialLink, Language } from '@adrianmartincano/ng-models';
```

---

## ToastService

Notificaciones emergentes (toasts). Añade `<lib-toast-container />` **una sola vez** en `app.html` y luego usa el servicio desde cualquier componente.

```typescript
import { ToastService } from '@adrianmartincano/ng-ui';

readonly toast = inject(ToastService);

// Métodos
this.toast.success('Producto añadido al carrito');
this.toast.error('Error al procesar el pago', { title: 'Pago fallido' });
this.toast.warning('Stock limitado');
this.toast.info('Tu sesión expira en 5 minutos');

// Con botón de acción
this.toast.success('Elemento eliminado', {
  action: { label: 'Deshacer', fn: () => this.restaurar() },
});

// Persistente (no desaparece solo) — duration: 0
this.toast.error('Sin conexión', { duration: 0 });

// Eliminar manualmente
this.toast.dismiss(id);
this.toast.clear();  // elimina todos
```

### Opciones

| Opción | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | — | Título en negrita sobre el mensaje |
| `duration` | `number` | `3500` (error: `6000`) | ms antes de desaparecer. `0` = no desaparece nunca |
| `action` | `{ label, fn }` | — | Botón de acción dentro del toast |

### `<lib-toast-container>`

```html
<!-- app.html — añadir una sola vez -->
<lib-toast-container />
```

Los toasts aparecen en la esquina inferior-derecha (móvil: parte inferior). Se apilan si hay varios a la vez.

---

## lib-skeleton

Placeholder animado para estados de carga. Sustituye al contenido mientras se cargan los datos.

```html
<!-- Tipos predefinidos -->
<lib-skeleton type="card" />
<lib-skeleton type="text" [lines]="4" />
<lib-skeleton type="title" />
<lib-skeleton type="avatar" width="48px" height="48px" />
<lib-skeleton type="image" />
<lib-skeleton type="button" />

<!-- Personalizado -->
<lib-skeleton type="custom" width="200px" height="12px" radius="99px" />

<!-- Combinado: avatar + texto -->
<div style="display:flex;align-items:center;gap:12px">
  <lib-skeleton type="avatar" />
  <div style="flex:1">
    <lib-skeleton type="title" />
    <lib-skeleton type="text" [lines]="2" />
  </div>
</div>
```

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `type` | `SkeletonType` | `'custom'` | `text` · `title` · `avatar` · `image` · `card` · `button` · `custom` |
| `lines` | `number` | `3` | Número de líneas (solo para `type="text"`) |
| `width` | `string` | — | CSS width (para custom) |
| `height` | `string` | — | CSS height (para custom) |
| `radius` | `string` | — | CSS border-radius (para custom) |

---

## lib-loader

Overlay de carga sobre cualquier contenido. Muestra un spinner mientras `[loading]` sea true.

```html
<lib-loader [loading]="cargando" message="Guardando cambios...">
  <!-- Tu contenido aquí — se muestra siempre, el spinner aparece encima -->
  <div>Contenido de la sección</div>
</lib-loader>
```

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `loading` | `boolean` | `false` | Activa el overlay con spinner |
| `message` | `string` | `''` | Texto bajo el spinner |
| `opaque` | `boolean` | `false` | Fondo sólido en vez de translúcido |

---

## lib-modal

Diálogo modal con overlay. Se controla con un signal/booleano desde el padre.

```html
<lib-modal
  [open]="modalVisible()"
  title="Confirmar acción"
  size="md"
  (closed)="modalVisible.set(false)"
>
  <p>¿Estás seguro de que quieres continuar?</p>

  <div slot="footer">
    <lib-button variant="ghost" (clicked)="modalVisible.set(false)">Cancelar</lib-button>
    <lib-button variant="accent" (clicked)="confirmar()">Confirmar</lib-button>
  </div>
</lib-modal>
```

```typescript
readonly modalVisible = signal(false);
```

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `open` | `boolean` | `false` | Muestra u oculta el modal |
| `title` | `string` | `''` | Título en la cabecera (alternativa a `slot=header`) |
| `size` | `ModalSize` | `'md'` | `sm` (400px) · `md` (560px) · `lg` (720px) · `xl` (960px) · `full` |
| `closable` | `boolean` | `true` | Permite cerrar con X y clic en el overlay |

**Output:** `(closed)` — se emite cuando el usuario cierra el modal.

**Slots:**
- `[slot=header]` — contenido del header (alternativa a `[title]`)
- Default — cuerpo del modal
- `[slot=footer]` — pie con botones de acción

**Comportamiento:**
- Bloquea el scroll del body mientras está abierto
- En móvil aparece como bottom sheet (desde abajo)
- Se cierra con Esc si `[closable]="true"`

---

## ThemeService

Servicio para gestionar el modo claro/oscuro. Disponible globalmente (`providedIn: 'root'`).

```typescript
import { ThemeService } from '@adrianmartincano/ng-ui';

@Component({ ... })
export class MiComponente {
  readonly theme = inject(ThemeService);
}
```

### Propiedades y métodos

| Miembro | Tipo | Descripción |
|---|---|---|
| `mode` | `Signal<'light' \| 'dark'>` | Modo actual |
| `isDark` | `Signal<boolean>` | `true` si el modo es oscuro |
| `toggle()` | `void` | Cambia entre claro y oscuro |
| `set(mode)` | `void` | Establece el modo explícitamente |

### Comportamiento

- Al inicializar, lee `localStorage` (`lib-theme`). Si no hay nada guardado, usa la preferencia del sistema (`prefers-color-scheme`).
- Al cambiar, aplica `data-theme="light|dark"` en `<html>` y persiste en `localStorage`.
- Escucha cambios del sistema en tiempo real (si el usuario no tiene preferencia guardada).
- Compatible con SSR: usa `PLATFORM_ID` para no acceder a `localStorage`/`window` en servidor.

### Ejemplo: botón de toggle manual

```typescript
// El lib-navbar ya incluye el toggle. Para usarlo en otro sitio:
@Component({
  template: `
    <button (click)="theme.toggle()">
      {{ theme.isDark() ? '☀️ Claro' : '🌙 Oscuro' }}
    </button>
  `
})
export class MiHeader {
  readonly theme = inject(ThemeService);
}
```

---

## I18nService

Servicio ligero para gestionar el idioma activo. No traduce textos — eso lo delega al sistema i18n que uses (`@ngx-translate`, Angular i18n, etc.). Su responsabilidad es mantener el idioma seleccionado y persistirlo.

```typescript
import { I18nService } from '@adrianmartincano/ng-ui';
```

### Propiedades y métodos

| Miembro | Tipo | Descripción |
|---|---|---|
| `currentCode` | `Signal<string>` | Código del idioma activo (`'es'`, `'en'`...) |
| `currentLang` | `Signal<Language \| null>` | Objeto `Language` completo del idioma activo |
| `setAvailable(langs)` | `void` | Registra los idiomas disponibles |
| `set(code)` | `void` | Cambia el idioma activo |

### Comportamiento

- Persiste el idioma en `localStorage` (`lib-lang`).
- Al cambiar, actualiza el atributo `lang` en `<html>` (accesibilidad y SEO).
- Compatible con SSR.

### Interfaz Language

```typescript
interface Language {
  code: string;    // 'es', 'en', 'fr', 'de'...
  label: string;   // 'Español', 'English', 'Français'...
  flag?: string;   // emoji de bandera: '🇪🇸', '🇬🇧'... (opcional)
}
```

### Ejemplo: conectar con @ngx-translate

```typescript
@Component({ ... })
export class AppComponent {
  private readonly i18n = inject(I18nService);
  private readonly translate = inject(TranslateService);

  constructor() {
    effect(() => {
      this.translate.use(this.i18n.currentCode());
    });
  }
}
```

---

## lib-table

Tabla responsive con columnas auto-inferidas o explícitas, ordenación y vista de tarjetas en móvil.

### Inputs

| Input | Tipo | Obligatorio | Por defecto | Descripción |
|---|---|---|---|---|
| `data` | `Record<string, unknown>[]` | Sí | — | Array de objetos con los datos |
| `columns` | `Column[]` | No | `[]` | Definición de columnas. Si está vacío, se infieren del primer objeto de `data` |
| `striped` | `boolean` | No | `false` | Alterna color en filas pares |
| `sortable` | `boolean` | No | `true` | Activa la ordenación al hacer clic en cabeceras |
| `emptyMessage` | `string` | No | `'No hay datos disponibles'` | Texto cuando `data` está vacío |

### Interfaz Column

```typescript
interface Column<T = Record<string, unknown>> {
  key: string;          // nombre del campo en el objeto de datos
  label: string;        // texto que se muestra en la cabecera
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'badge';
  sortable?: boolean;   // false para desactivar ordenación en esta columna
  align?: 'left' | 'center' | 'right';
  width?: string;       // ej. '80px', '20%'
  format?: (value: unknown, row: T) => string;  // función de formato personalizado
  badgeMap?: Record<string, string>;            // solo para type:'badge' — mapa valor → color CSS
}
```

### Tipos de columna

| Tipo | Renderizado | Ejemplo |
|---|---|---|
| `text` (por defecto) | Texto plano | `'Hola mundo'` |
| `number` | Número sin formato | `42` |
| `currency` | Formato moneda ES (`€`) | `'125,50 €'` |
| `date` | Fecha formato ES (`dd/mm/yyyy`) | `'28/05/2025'` |
| `boolean` | ✓ verde / ✗ rojo | — |
| `badge` | Pastilla de color | Requiere `badgeMap` |

### Ejemplos

**Auto-inferir columnas** (nombres del objeto → etiquetas automáticas):
```typescript
// TS
datos = [
  { id: 1, cliente: 'María', total: 125.5 },
  { id: 2, cliente: 'Juan',  total: 89.99 },
];
```
```html
<!-- HTML — sin [columns], la tabla infiere id / cliente / total -->
<lib-table [data]="datos" />
```

**Cambiar la etiqueta de una columna** sin modificar los datos:
```typescript
columnas: Column[] = [
  { key: 'id',      label: '#' },
  { key: 'cliente', label: 'Nombre completo' },
  { key: 'total',   label: 'Importe',  type: 'currency', align: 'right' },
];
```
```html
<lib-table [data]="datos" [columns]="columnas" />
```

**Con badge de estado y función de formato personalizado:**
```typescript
columnas: Column[] = [
  { key: 'nombre', label: 'Producto' },
  { key: 'precio', label: 'Precio', type: 'currency', align: 'right' },
  { key: 'stock',  label: 'Stock',  type: 'number', align: 'right',
    format: (v) => `${v} uds.` },
  {
    key: 'estado',
    label: 'Estado',
    type: 'badge',
    align: 'center',
    badgeMap: {
      Activo:    '#28a745',
      Pausado:   '#ffc107',
      Agotado:   '#dc3545',
    },
  },
];
```

**Con todas las opciones:**
```html
<lib-table
  [data]="productos"
  [columns]="columnas"
  [striped]="true"
  [sortable]="true"
  emptyMessage="No hay productos que mostrar"
/>
```

### Comportamiento responsive

| Ancho pantalla | Comportamiento |
|---|---|
| `> 480px` | Tabla horizontal con scroll si hay muchas columnas |
| `< 480px` | Cada fila se convierte en una tarjeta con etiqueta/valor |

---

## lib-navbar

Barra de navegación sticky, responsive, con soporte para dropdowns y menú hamburguesa.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `items` | `NavItem[]` | `[]` | Items del menú |
| `logo` | `string` | `''` | URL de la imagen del logo |
| `logoText` | `string` | `''` | Texto del logo (puede ir junto a la imagen) |
| `logoPath` | `string` | `'/'` | Ruta al hacer clic en el logo |
| `languages` | `Language[]` | `[]` | Idiomas disponibles. Si tiene más de 1, aparece el selector |
| `showThemeToggle` | `boolean` | `true` | Muestra/oculta el botón de modo oscuro/claro |
| `showCart` | `boolean` | `false` | Muestra el icono del carrito |
| `cartCount` | `number` | `0` | Número de items en el carrito. Si > 0, aparece un badge con animación |

### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `languageChange` | `string` | Emite el código del idioma seleccionado (`'es'`, `'en'`...) |
| `cartClick` | `void` | Emite al hacer clic en el icono del carrito |

### Interfaz NavItem

```typescript
interface NavItem {
  label: string;           // texto del enlace
  path?: string;           // ruta interna (routerLink) o URL externa
  icon?: string;           // (reservado para futuro uso)
  children?: NavItem[];    // si tiene hijos, se convierte en dropdown
  external?: boolean;      // true → abre en nueva pestaña con target="_blank"
  badge?: string | number; // pastilla numérica o de texto junto al label
}
```

### Slot de contenido

Puedes insertar contenido extra (botón CTA, avatar, etc.) dentro del menú usando `ng-content`:

```html
<lib-navbar [items]="menuItems" logoText="MiApp">
  <lib-button variant="accent" size="sm" [routerLink]="'/registro'">
    Registrarse
  </lib-button>
</lib-navbar>
```

### Ejemplos

**Menú simple:**
```typescript
menuItems: NavItem[] = [
  { label: 'Inicio',    path: '/' },
  { label: 'Productos', path: '/productos' },
  { label: 'Contacto',  path: '/contacto' },
];
```

**Con dropdown:**
```typescript
menuItems: NavItem[] = [
  { label: 'Inicio', path: '/' },
  {
    label: 'Catálogo',
    children: [
      { label: 'Ropa',       path: '/catalogo/ropa' },
      { label: 'Calzado',    path: '/catalogo/calzado' },
      { label: 'Accesorios', path: '/catalogo/accesorios' },
    ],
  },
  { label: 'Blog',    path: '/blog',              badge: 3 },
  { label: 'GitHub',  path: 'https://github.com', external: true },
];
```

```html
<lib-navbar [items]="menuItems" logo="/assets/logo.svg" logoText="MiTienda" />
```

### Comportamiento responsive

| Ancho | Comportamiento |
|---|---|
| `< 768px` | Botón hamburguesa. Menú se despliega verticalmente. Dropdowns inline. |
| `≥ 768px` | Menú horizontal. Dropdowns flotantes al hacer clic. |

---

## lib-footer

Footer multi-columna responsive, con secciones de links, texto libre y slot para contenido extra.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `sections` | `FooterSection[]` | `[]` | Secciones de links o texto |
| `logo` | `string` | `''` | URL de la imagen del logo |
| `logoText` | `string` | `''` | Texto del logo |
| `logoPath` | `string` | `'/'` | Ruta al hacer clic en el logo |
| `description` | `string` | `''` | Descripción breve bajo el logo |
| `copyright` | `string` | `''` | Texto de copyright. Si está vacío: `© {año} {logoText}` |
| `socialLinks` | `SocialLink[]` | `[]` | Iconos de redes sociales. Se renderizan junto al logo |

### Interfaz SocialLink

```typescript
type SocialPlatform =
  'instagram' | 'twitter' | 'x' | 'facebook' | 'youtube' |
  'tiktok' | 'linkedin' | 'github' | 'pinterest' | 'whatsapp';

interface SocialLink {
  platform: SocialPlatform;   // determina el icono SVG a mostrar
  url: string;                // URL del perfil del usuario
  label?: string;             // tooltip (si está vacío, usa el nombre de la plataforma)
}
```

**Ejemplo con perfil real:**
```typescript
socialLinks: SocialLink[] = [
  { platform: 'instagram', url: 'https://www.instagram.com/mitaruadora' },
  { platform: 'tiktok',    url: 'https://www.tiktok.com/@mitaruadora' },
  { platform: 'whatsapp',  url: 'https://wa.me/34600000000' },
  { platform: 'facebook',  url: 'https://www.facebook.com/mitaruadora' },
];
```

**Alternativa — links de texto en sección** (sin iconos, más sencillo):
```typescript
{
  title: 'Síguenos',
  links: [
    { label: 'Instagram', path: 'https://instagram.com/mitaruadora', external: true },
    { label: 'TikTok',    path: 'https://tiktok.com/@mitaruadora',   external: true },
  ],
}
```

Puedes combinar ambos: `[socialLinks]` para los iconos junto al logo, y una sección `Síguenos` con links de texto en las columnas.

### Interfaz FooterSection

```typescript
interface FooterSection {
  title?: string;        // cabecera de la sección
  links?: FooterLink[];  // lista de enlaces
  text?: string;         // texto libre (sin links)
}

interface FooterLink {
  label: string;        // texto del enlace
  path?: string;        // ruta interna o URL externa
  external?: boolean;   // true → abre en nueva pestaña
}
```

### Slots de contenido

| Slot | Descripción |
|---|---|
| `[slot=brand]` | Contenido extra bajo el logo (redes sociales, etc.) |
| `[slot=bottom]` | Contenido extra en la barra inferior (links legales, etc.) |
| Sin slot | Contenido libre en el área de secciones |

### Ejemplo completo

```typescript
footerSections: FooterSection[] = [
  {
    title: 'Tienda',
    links: [
      { label: 'Productos',   path: '/productos' },
      { label: 'Ofertas',     path: '/ofertas' },
      { label: 'Novedades',   path: '/novedades' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', path: '/sobre-nosotros' },
      { label: 'Contacto',       path: '/contacto' },
      { label: 'Trabaja con nosotros', path: '/empleo' },
    ],
  },
  {
    title: 'Contacto',
    text: 'info@mitienda.es · +34 600 000 000',
  },
  {
    title: 'Síguenos',
    links: [
      { label: 'Instagram', path: 'https://instagram.com', external: true },
      { label: 'TikTok',    path: 'https://tiktok.com',   external: true },
    ],
  },
];
```

```html
<lib-footer
  [sections]="footerSections"
  logo="/assets/logo.svg"
  logoText="MiTienda"
  logoPath="/"
  description="Tu tienda de moda sostenible."
  copyright="© 2025 MiTienda S.L. — Todos los derechos reservados"
>
  <!-- Slot brand: redes sociales bajo el logo -->
  <div slot="brand" style="display:flex; gap:8px; margin-top:8px;">
    <lib-button variant="ghost" size="sm">Instagram</lib-button>
    <lib-button variant="ghost" size="sm">TikTok</lib-button>
  </div>

  <!-- Slot bottom: links legales -->
  <div slot="bottom" style="display:flex; gap:16px;">
    <a routerLink="/privacidad">Privacidad</a>
    <a routerLink="/cookies">Cookies</a>
  </div>
</lib-footer>
```

### Comportamiento responsive

| Ancho | Columnas |
|---|---|
| `< 640px` | 1 columna, todo apilado |
| `≥ 640px` | 2 columnas |
| `≥ 768px` | Logo (2fr) + secciones (1fr cada una) |

---

## lib-button

Botón con variantes de estilo, tamaños, estado de carga y soporte para navegación.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `variant` | `ButtonVariant` | `'primary'` | Estilo visual |
| `size` | `ButtonSize` | `'md'` | Tamaño |
| `loading` | `boolean` | `false` | Muestra spinner y deshabilita el botón |
| `disabled` | `boolean` | `false` | Deshabilita el botón |
| `full` | `boolean` | `false` | Ocupa el 100% del ancho del contenedor |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo HTML del elemento `<button>` |
| `routerLink` | `string \| null` | `null` | Si se define, renderiza como `<a routerLink>` |
| `href` | `string \| null` | `null` | Si se define, renderiza como `<a href target="_blank">` |

### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `clicked` | `MouseEvent` | Se emite al hacer clic (solo en modo `<button>`) |

### Variantes (`ButtonVariant`)

| Valor | Apariencia | Spinner (loading) |
|---|---|---|
| `primary` | Fondo `--color-primary` (oscuro), texto blanco | Blanco |
| `accent` | Fondo `--color-accent`, texto blanco | Blanco |
| `secondary` | Fondo `--color-surface` + borde `--color-border`, texto oscuro | Accent |
| `outline` | Borde `--color-accent`, fondo transparente → rellena accent al hover | Accent |
| `ghost` | Transparente, texto `--color-accent` → fondo suave tintado al hover | Accent |
| `danger` | Fondo `--color-danger`, texto blanco | Blanco |

> Todos los botones reservan espacio para el borde (2px transparente) para evitar saltos de tamaño al hacer hover. El estado `disabled` usa `opacity: 0.45`.

### Tamaños (`ButtonSize`)

| Valor | Padding | Font size |
|---|---|---|
| `sm` | `0.5rem 0.75rem` | 14px |
| `md` | `0.75rem 1.25rem` | 16px |
| `lg` | `1rem 2rem` | 18px |

### Ejemplos

```html
<!-- Básico -->
<lib-button>Guardar</lib-button>

<!-- Variante y tamaño -->
<lib-button variant="accent" size="lg">Comprar ahora</lib-button>

<!-- Navegación interna -->
<lib-button variant="outline" [routerLink]="'/productos'">Ver productos</lib-button>

<!-- Enlace externo -->
<lib-button variant="ghost" href="https://github.com">GitHub</lib-button>

<!-- Estado de carga -->
<lib-button variant="primary" [loading]="enviando">
  {{ enviando ? 'Enviando...' : 'Enviar' }}
</lib-button>

<!-- Ancho completo -->
<lib-button variant="accent" [full]="true" type="submit">
  Iniciar sesión
</lib-button>

<!-- Con evento click -->
<lib-button variant="danger" (clicked)="onEliminar()">Eliminar</lib-button>
```

---

## lib-card

Tarjeta flexible con imagen, título, badge y slots de contenido libre.

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `title` | `string` | `''` | Título de la tarjeta |
| `subtitle` | `string` | `''` | Subtítulo bajo el título |
| `image` | `string` | `''` | URL de la imagen (ratio 16:9) |
| `imageAlt` | `string` | `''` | Alt de la imagen. Si está vacío usa el `title` |
| `badge` | `string` | `''` | Pastilla sobre la imagen (ej. "Nuevo", "-20%") |
| `routerLink` | `string \| null` | `null` | Hace la tarjeta y el título clickables |
| `clickable` | `boolean` | `false` | Añade efecto hover sin routerLink |
| `flat` | `boolean` | `false` | Sin borde, con sombra sutil en vez de borde |

### Slots de contenido

| Slot | Descripción |
|---|---|
| Sin slot (default) | Cuerpo de la tarjeta: texto, precio, botones... |
| `[slot=footer]` | Pie de la tarjeta (fuera del padding) |

### Ejemplos

**Tarjeta básica:**
```html
<lib-card
  title="Silla nórdica"
  subtitle="Mobiliario · Madera"
  image="/assets/silla.jpg"
  badge="Nuevo"
  [routerLink]="'/productos/silla-nordica'"
>
  <p>Diseño escandinavo con patas de madera maciza.</p>
  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
    <strong>299,00 €</strong>
    <lib-button variant="accent" size="sm">Añadir</lib-button>
  </div>
</lib-card>
```

**Grid de cards responsive:**
```html
<div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
  @for (producto of productos; track producto.id) {
    <lib-card
      [title]="producto.nombre"
      [subtitle]="producto.categoria"
      [image]="producto.imagen"
      [badge]="producto.badge"
      [routerLink]="'/productos/' + producto.slug"
    >
      <strong>{{ producto.precio | currency:'EUR' }}</strong>
    </lib-card>
  }
</div>
```

**Sin imagen, con slot footer:**
```html
<lib-card title="Plan Pro" subtitle="Todo incluido" [flat]="true">
  <ul>
    <li>Usuarios ilimitados</li>
    <li>Soporte prioritario</li>
  </ul>

  <div slot="footer" style="padding:16px; border-top:1px solid var(--color-border);">
    <lib-button variant="accent" [full]="true">Contratar</lib-button>
  </div>
</lib-card>
```

---

