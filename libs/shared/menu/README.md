# @adrianmartincano/ng-menu

Carta y **menú del día** de restauración. Dos agregados independientes: la **carta** (permanente:
categorías → platos con alérgenos y raciones) y el **menú del día** (fechado, publicable y clonable).
Presentación **tipográfica** configurable (fuente, color, layout) — **sin imágenes subidas**.

> Contraparte backend: módulo `spring-menu` (`dev.pimon.menu`). Componentes **controlados**: el host
> posee los datos y hace el HTTP.

---

## Instalación

```bash
npm install @adrianmartincano/ng-menu
```

**Peer dependencies:**

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=1.0.0` |
| `@adrianmartincano/ng-models` | `>=1.0.0` |

```css
@import '@adrianmartincano/ng-theme/index.css';
```

---

## Componentes

```typescript
import {
  MenuPublicComponent,
  MenuCategoriesAdminComponent, MenuItemsAdminComponent,
  DailyMenuAdminComponent, MenuStylePickerComponent,
  FONT_STACK, CATEGORY_ICON, ALLERGEN_LABEL, formatPrice,
} from '@adrianmartincano/ng-menu';
import {
  Carta, MenuCategory, MenuItem, DailyMenu, MenuPresentation,
  CreateMenuCategoryRequest, CreateMenuItemRequest, SaveDailyMenuRequest,
} from '@adrianmartincano/ng-models';
```

| Componente | Para qué | Par backend |
|---|---|---|
| `<lib-menu-public>` | Carta pública themeable (menú del día arriba + carta debajo) | `GET /api/menu`, `GET /api/menu/daily` |
| `<lib-menu-categories-admin>` | CRUD de categorías (nombre, **icono curado**, orden) | `…/admin/menu/categories` |
| `<lib-menu-items-admin>` | CRUD de platos: precio base o **raciones**, alérgenos, flags dietéticos | `…/admin/menu/items` |
| `<lib-daily-menu-admin>` | Menú del día: grupos/opciones, **publicar/despublicar/clonar** | `…/admin/menu/daily` |
| `<lib-menu-style-picker>` | Fuente/color/layout con **previsualización en vivo** | `GET/PUT /api/admin/menu/presentation` |

---

## Carta pública — `<lib-menu-public>`

```html
<lib-menu-public [carta]="carta()" [dailyMenus]="menusDelDia()" />
```

`carta` es el objeto que devuelve `GET /api/menu` (categorías con sus platos disponibles + la
presentación); `dailyMenus` son los menús del día publicados (`GET /api/menu/daily`). El componente
aplica la presentación vía variables CSS (`--menu-heading-font`, `--menu-body-font`, color de acento,
layout) y muestra raciones, alérgenos y flags dietéticos.

```typescript
this.api.getCarta().subscribe(c => this.carta.set(c));            // GET /api/menu
this.api.getDaily(hoy).subscribe(d => this.menusDelDia.set(d));   // GET /api/menu/daily
```

---

## Sin imágenes (decisión de diseño)

La carta es **tipográfica**: no hay fotos por plato (envejecen mal y compiten con la tipografía
cuidada). La decoración es un **icono curado** por categoría (`CategoryIcon` → emoji/SVG vía
`CATEGORY_ICON`) y la **presentación** (fuente/color/layout). No depende de `ng-upload`.

---

## Estilo — `<lib-menu-style-picker>`

```html
<lib-menu-style-picker [presentation]="presentacion()" (saved)="guardarPresentacion($event)" />
```

Edita la presentación con **vista previa en vivo**. Las fuentes son una **whitelist** (`FontChoice`:
`SYSTEM | SERIF | SANS | SLAB | DISPLAY | HANDWRITTEN | MONO`) que el front mapea a pilas de fuentes
(`FONT_STACK`) — nunca CSS libre. Gobierna carta y menú del día por igual.

---

## Platos — `<lib-menu-items-admin>`

Cada plato exige **al menos un precio**: o `price` base, o una o varias **raciones** (`PricedPortion`,
p. ej. *Media 6€ / Ración 11€*). Lleva los 14 **alérgenos UE** (`Allergen`, con etiquetas en
`ALLERGEN_LABEL`), flags dietéticos (vegano/vegetariano/sin gluten/picante) y `available` para
"agotado hoy" sin borrarlo.

---

## Menú del día — `<lib-daily-menu-admin>`

```html
<lib-daily-menu-admin
  [dailyMenus]="menusDeLaFecha()" [menuItems]="platos()" [date]="fecha()"
  (dateChange)="fecha.set($event)"
  (created)="crearMenu($event)" (updated)="editarMenu($event)"
  (published)="publicar($event)" (unpublished)="despublicar($event)"
  (cloned)="clonar($event)" (deleted)="borrarMenu($event)"
/>
```

Cada opción de un grupo (Primeros, Postres…) **referencia un plato de la carta** (hereda nombre,
descripción y alérgenos) **o es una línea libre** (especial del día). `cloned` emite `{ id, toDate }`
para duplicar un menú a otra fecha como borrador — el caso real "el de ayer con un cambio".

Las utilidades `formatPrice(amount, currency)` (con `Intl` nativo), `CATEGORY_ICON`, `ALLERGEN_LABEL`
y `FONT_STACK` se exportan por si las necesitas fuera de los componentes.
