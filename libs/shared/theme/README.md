# @adrianmartincano/ng-theme

Design system CSS puro (sin JavaScript): variables de color, tipografía y espaciado, modo oscuro, grid, animaciones, spinner, progress bar y clases utilitarias. Es la base visual del resto de librerías @adrianmartincano/ng-*.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-theme
```

**Uso:** impórtalo una vez en el `styles.css` global de tu app:

```css
@import '@adrianmartincano/ng-theme/index.css';
```

---

## CSS Theme y Modo Oscuro

Importar en el `styles.css` de la app:

```css
@import '@adrianmartincano/ng-theme/index.css';
```

---

### Dos formas de tematizar — no se solapan

El sistema soporta dos enfoques que pueden combinarse libremente. **La variable directa siempre gana sobre la paleta** gracias al orden de cascada CSS.

#### Opción A — Paleta de 4 colores (rápido)

Define solo 4 variables y toda la web se adapta. Las derivaciones (`--color-primary-light`, `--color-accent-hover`, etc.) se calculan automáticamente con `color-mix()`.

```css
@import '@adrianmartincano/ng-theme/index.css';

:root {
  --p1: #1e3a8a;   /* oscuro  → navbar, footer, btn primary */
  --p2: #3b82f6;   /* acento  → btn CTA, links, focus, badges */
  --p3: #bfdbfe;   /* neutro  → bordes, separadores */
  --p4: #eff6ff;   /* claro   → fondos, surfaces, cards */
}
```

Paletas predefinidas:

| Nombre | `--p1` | `--p2` | `--p3` | `--p4` |
|---|---|---|---|---|
| Rojo (defecto) | `#1e1e1e` | `#ff4d4d` | `#e0e0e0` | `#f8f9fa` |
| Azul | `#1e3a8a` | `#3b82f6` | `#bfdbfe` | `#eff6ff` |
| Verde | `#14532d` | `#22c55e` | `#bbf7d0` | `#f0fdf4` |
| Morado | `#3b0764` | `#a855f7` | `#e9d5ff` | `#faf5ff` |
| Naranja | `#7c2d12` | `#f97316` | `#fed7aa` | `#fff7ed` |
| Rosa | `#881337` | `#f43f5e` | `#fecdd3` | `#fff1f2` |

#### Opción B — Variables individuales (preciso)

Sobreescribe solo las variables que necesites. Útil cuando el diseñador tiene colores exactos.

```css
@import '@adrianmartincano/ng-theme/index.css';

:root {
  --color-primary: #1a0a2e;
  --color-accent:  #d946ef;
  --color-border:  #f5d0fe;   /* un borde exacto, no el que calcularía la paleta */
}
```

#### Mezclado — lo mejor de ambos

```css
:root {
  /* Paleta para lo general */
  --p1: #1a0a2e;
  --p2: #d946ef;
  --p3: #f5d0fe;
  --p4: #fdf4ff;

  /* Override puntual donde el color-mix no convence */
  --color-accent-hover: #c026d3;   /* quiero este exacto, no el derivado */
  --color-border: #e9d5ff;         /* borde más específico */
}
```

> **Por qué no se solapan:** tu `styles.css` se importa después del theme, así que cualquier variable que definas en tu `:root` gana por cascada. Las derivaciones (`--color-primary-light`) referencian `var(--color-primary)` (no `var(--p1)`), así que actualizan correctamente con cualquiera de los dos enfoques.

---

### Modo oscuro

`ThemeService` lo activa automáticamente añadiendo `data-theme="dark"` en `<html>`. Los colores de marca (`--p1`, `--p2`, `--color-primary`, `--color-accent`) no cambian — mantienen la identidad del cliente. Solo cambian fondos, bordes y textos.

---

### Variables disponibles

#### Paleta (Opción A)
| Variable | Default | Qué afecta |
|---|---|---|
| `--p1` | `#1e1e1e` | navbar, footer, btn primary, headings |
| `--p2` | `#ff4d4d` | btn accent, links, focus, badges, progress |
| `--p3` | `#e0e0e0` | bordes, separadores, inputs |
| `--p4` | `#f8f9fa` | fondos de sección, surfaces, cards |

#### Colores semánticos (Opción B)
| Variable | Default | Uso |
|---|---|---|
| `--color-primary` | deriva de `--p1` | Fondo navbar, footer, botón primary |
| `--color-primary-light` | auto (color-mix) | Hover de primary |
| `--color-primary-lighter` | auto (color-mix) | Versión más clara de primary |
| `--color-accent` | deriva de `--p2` | Botón accent/outline, links activos, badges |
| `--color-accent-hover` | auto (color-mix) | Hover de accent |
| `--color-background` | `#ffffff` | Fondo general |
| `--color-surface` | deriva de `--p4` | Fondo de secciones alternas, tabla head |
| `--color-surface-alt` | auto (color-mix) | Hover de filas, inputs hover |
| `--color-border` | deriva de `--p3` | Bordes de tabla, cards, inputs |
| `--color-text` | `#1a1a1a` | Texto principal (fijo, no deriva de la paleta) |
| `--color-text-secondary` | `#595959` | Subtítulos, texto secundario |
| `--color-text-muted` | `#909090` | Placeholders, ayuda |
| `--color-text-inverse` | `#ffffff` | Texto sobre fondos oscuros |
| `--color-success` | `#28a745` | Estado ok, boolean true |
| `--color-warning` | `#ffc107` | Advertencias |
| `--color-danger` | `#dc3545` | Errores, botón danger, boolean false |
| `--color-info` | `#17a2b8` | Información |

#### Tipografía
| Variable | Valor |
|---|---|
| `--font-family` | System font stack |
| `--font-size-xs` | `0.75rem` (12px) |
| `--font-size-sm` | `0.875rem` (14px) |
| `--font-size-base` | `1rem` (16px) |
| `--font-size-lg` | `1.125rem` (18px) |
| `--font-size-xl` | `1.25rem` (20px) |
| `--font-size-2xl` | `1.5rem` (24px) |
| `--font-size-3xl` | `1.875rem` (30px) |
| `--font-size-4xl` | `2.25rem` (36px) |

#### Espaciado
| Variable | Valor |
|---|---|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-12` | `3rem` (48px) |
| `--space-16` | `4rem` (64px) |

#### Layout
| Variable | Valor por defecto |
|---|---|
| `--container-max` | `1280px` |
| `--navbar-height` | `60px` |
| `--radius-sm` | `0.25rem` |
| `--radius-md` | `0.5rem` |
| `--radius-lg` | `0.75rem` |
| `--radius-full` | `9999px` |
| `--shadow-sm` | sombra sutil |
| `--shadow-md` | sombra media |
| `--shadow-lg` | sombra pronunciada |
| `--transition-fast` | `120ms ease` |
| `--transition-base` | `200ms ease` |

---


## Spinner y Progress bar

Componentes de estado globales del theme, disponibles en cualquier app o componente.

### Spinner

```html
<!-- Tamaños -->
<span class="lib-spinner lib-spinner--sm"></span>   <!-- 14px -->
<span class="lib-spinner"></span>                    <!-- 20px (default) -->
<span class="lib-spinner lib-spinner--lg"></span>   <!-- 32px -->

<!-- Sobre fondo oscuro (botón accent, etc.) -->
<span class="lib-spinner lib-spinner--inverse"></span>

<!-- Color personalizado -->
<span class="lib-spinner" style="color: var(--color-success)"></span>
```

El color del spinner hereda de `color` del elemento padre. Para cambiarlo basta con `style="color: ..."` o una clase de texto del theme (`.text-accent`, `.text-success`...).

### Barra de progreso

```html
<!-- Básica -->
<div class="lib-progress">
  <div class="lib-progress-bar" [style.width.%]="valor"></div>
</div>

<!-- Con variantes de color -->
<div class="lib-progress lib-progress--success">
  <div class="lib-progress-bar" style="width: 100%"></div>
</div>

<div class="lib-progress lib-progress--warning">
  <div class="lib-progress-bar" [style.width.%]="valor"></div>
</div>

<!-- Indeterminada (sin valor concreto, animación automática) -->
<div class="lib-progress lib-progress--indeterminate">
  <div class="lib-progress-bar"></div>
</div>
```

| Clase modificadora | Efecto |
|---|---|
| `lib-progress--success` | Barra verde |
| `lib-progress--warning` | Barra amarilla |
| `lib-progress--indeterminate` | Animación de vaivén (sin valor) |

---

## Animaciones y utilidades CSS

### Animaciones

Añade la clase al elemento — se ejecuta al renderizarse. Para `pulse`, `bounce` y `spin` son continuas.

```html
<div class="animate-fade-in">Aparece con fade</div>
<div class="animate-slide-up animate-delay-2">Sube con retraso de 200ms</div>
<span class="animate-spin">⟳</span>
```

| Clase | Efecto |
|---|---|
| `animate-fade-in` | Aparece desde opacidad 0 |
| `animate-slide-up` | Entra subiendo desde abajo |
| `animate-slide-down` | Entra bajando desde arriba |
| `animate-slide-left` | Entra desde la derecha |
| `animate-scale-in` | Escala desde 0.95 a 1 |
| `animate-pulse` | Parpadeo continuo |
| `animate-bounce` | Rebote continuo |
| `animate-spin` | Rotación continua (loaders) |

Retrasos: `animate-delay-1` (100ms) · `animate-delay-2` (200ms) · `animate-delay-3` (300ms) · `animate-delay-4` (500ms) · `animate-delay-5` (700ms)

---

### Formularios base

Clases globales reutilizables en cualquier formulario propio (los componentes `lib-form` y `lib-login` ya las usan internamente):

```html
<label class="lib-label" for="x">Campo <span class="lib-required">*</span></label>
<input id="x" class="lib-input" type="text" />
<p class="lib-hint">Texto de ayuda</p>

<!-- Con error -->
<input class="lib-input lib-input--error" />
<p class="lib-field-error">Mensaje de error</p>

<!-- Tipos especiales -->
<textarea class="lib-input lib-textarea"></textarea>
<select   class="lib-input lib-select">...</select>
<input class="lib-radio"    type="radio" />
<input class="lib-checkbox" type="checkbox" />
```

---

### Breakpoint helpers

```html
<div class="hide-from-md">Solo en móvil</div>
<div class="hide-until-md">Solo en tablet/desktop</div>
<p class="text-center text-md-left">Centrado en móvil, izquierda en tablet+</p>
<div class="flex-md gap-4"><div>Col A</div><div>Col B</div></div>
<img class="w-full object-cover aspect-video" />
<div class="rounded-full shadow mx-auto"></div>
```

---

## Grid CSS

Clases de utilidad del design system para crear layouts responsive.

### Contenedor

```html
<div class="container">
  <!-- Centrado, max-width 1280px, padding lateral responsive -->
</div>
```

### Grid

```html
<!-- 1 col en móvil, 2 en tablet, 3 en desktop -->
<div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
  <div>...</div>
  <div>...</div>
  <div>...</div>
</div>
```

### Clases de columnas

| Clase | Breakpoint | Columnas |
|---|---|---|
| `grid-cols-1` | siempre | 1 |
| `grid-cols-2` | siempre | 2 |
| `grid-cols-3` | siempre | 3 |
| `grid-cols-4` | siempre | 4 |
| `grid-cols-sm-2` | `≥ 480px` | 2 |
| `grid-cols-sm-3` | `≥ 480px` | 3 |
| `grid-cols-md-2` | `≥ 768px` | 2 |
| `grid-cols-md-3` | `≥ 768px` | 3 |
| `grid-cols-md-4` | `≥ 768px` | 4 |
| `grid-cols-lg-2` | `≥ 1024px` | 2 |
| `grid-cols-lg-3` | `≥ 1024px` | 3 |
| `grid-cols-lg-4` | `≥ 1024px` | 4 |
| `grid-cols-lg-6` | `≥ 1024px` | 6 |
| `col-full` | — | Ocupa todas las columnas |

### Gap

| Clase | Espacio |
|---|---|
| `gap-2` | `0.5rem` (8px) |
| `gap-4` | `1rem` (16px) |
| `gap-6` | `1.5rem` (24px) |
| `gap-8` | `2rem` (32px) |

### Breakpoints del sistema

| Nombre | Ancho mínimo | Uso típico |
|---|---|---|
| (base) | `0px` | Móvil — diseño por defecto |
| `sm` | `480px` | Móvil grande |
| `md` | `768px` | Tablet |
| `lg` | `1024px` | Desktop |
| `xl` | `1280px` | Desktop grande |
