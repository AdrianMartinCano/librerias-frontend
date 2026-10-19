# @adrianmartincano/ng-products

Catálogo de productos para Angular: tarjeta de producto (lib-product-card), grid con filtros y ordenación (lib-product-grid) y CartService para gestionar el carrito.

> **Formato e idioma:** los importes se formatean con `Intl` nativo (sin `registerLocaleData`).
> Por defecto euros en formato español; **configurable** —otras monedas, conversión por tasas y
> selector en el navbar— con `provideLibFormat`. Ver
> [README raíz → Formato e idioma](../../../README.md#formato-e-idioma).

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-products
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

## Products (`@adrianmartincano/ng-products`)

Catálogo de productos con tarjeta individual, grid con filtros y servicio de carrito.

> **Accesible:** la tarjeta clicable se opera con teclado (Enter/Espacio), el rating expone su
> valor por `aria-label` (estrellas decorativas), y en el grid la búsqueda y los selectores llevan
> `aria-label` y el contador de resultados es `aria-live`. Importes formateados con `FormatService`
> (multi-divisa, ver [ng-models](../models/README.md)).

```typescript
import { ProductCardComponent, ProductGridComponent, CartService } from '@adrianmartincano/ng-products';
import { Product, ProductFilter, ProductSortBy, CartItem } from '@adrianmartincano/ng-models';
```

---

### `<lib-product-card>` — Tarjeta individual

```html
<lib-product-card
  [product]="miProducto"
  [showRating]="true"
  [showAddToCart]="true"
  addToCartLabel="Añadir al carrito"
  orientation="vertical"
  (cardClick)="onVer($event)"
  (addToCart)="onAnadir($event)"
/>
```

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `product` | `Product` | — (obligatorio) | El producto a mostrar |
| `showRating` | `boolean` | `true` | Muestra las estrellas y número de reseñas |
| `showAddToCart` | `boolean` | `true` | Muestra el botón "Añadir". Se oculta si `inStock: false` |
| `addToCartLabel` | `string` | `'Añadir'` | Texto del botón |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Vertical = imagen arriba. Horizontal = imagen a la izquierda |
| `routerLink` | `string \| null` | `null` | Ruta de la página de detalle. Si se provee, imagen y título son enlaces. Usa `routePrefix` en el grid para generarla automáticamente. |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `cardClick` | `Product` | Clic en la tarjeta cuando **no** hay `routerLink` |
| `addToCart` | `Product` | Clic en el botón añadir (no navega aunque haya `routerLink`) |

#### Navegación a detalle — tres formas

```html
<!-- 1. routePrefix en el grid (recomendado) — más adelante -->

<!-- 2. routerLink directo en la tarjeta individual -->
<lib-product-card
  [product]="producto"
  [routerLink]="'/productos/' + (producto.slug || producto.id)"
  (addToCart)="cart.add($event)"
/>

<!-- 3. Sin enlace, manejas la navegación tú -->
<lib-product-card
  [product]="producto"
  (cardClick)="router.navigate(['/productos', producto.slug])"
  (addToCart)="cart.add($event)"
/>
```

#### Campos del modelo `Product`

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;   // si > price, muestra tachado + % descuento
  category: string;
  imageUrl: string;
  images?: string[];
  inStock: boolean;
  rating: number;           // 0-5 (decimales: 4.5 → 4 llenas + media)
  reviewCount: number;
  badge?: string;           // etiqueta: "Nuevo", "-20%", "Oferta"...
  slug?: string;            // para routing
}
```

---

### `<lib-product-grid>` — Grid con filtros

```html
<lib-product-grid
  [products]="productos"
  [cols]="3"
  [showSearch]="true"
  [showFilters]="true"
  [showSort]="true"
  emptyMessage="No hay productos disponibles"
  (productClick)="onVer($event)"
  (addToCart)="onAnadir($event)"
/>
```

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `products` | `Product[]` | — (obligatorio) | Array de productos |
| `cols` | `2 \| 3 \| 4` | `3` | Columnas en desktop (móvil siempre 1, tablet 2) |
| `showSearch` | `boolean` | `false` | Barra de búsqueda en tiempo real (nombre, descripción, categoría) |
| `showFilters` | `boolean` | `false` | Selector de categoría (auto-inferido del array) |
| `showSort` | `boolean` | `false` | Selector de ordenación |
| `showRating` | `boolean` | `true` | Muestra rating en cada tarjeta |
| `showAddToCart` | `boolean` | `true` | Muestra botón añadir en cada tarjeta |
| `addToCartLabel` | `string` | `'Añadir'` | Texto del botón |
| `searchPlaceholder` | `string` | `'Buscar productos...'` | Placeholder del input de búsqueda |
| `emptyMessage` | `string` | `'No hay productos disponibles'` | Texto cuando no hay resultados |
| `loading` | `boolean` | `false` | Muestra skeleton cards animadas |
| `routePrefix` | `string` | `''` | Prefijo de ruta para la página de detalle. El grid genera automáticamente: `routePrefix + '/' + (product.slug \|\| product.id)`. Si está vacío, las tarjetas usan `(cardClick)`. |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `productClick` | `Product` | Clic en una tarjeta cuando **no** hay `routePrefix` |
| `addToCart` | `Product` | Clic en el botón añadir de cualquier tarjeta |

#### Navegación a detalle con `routePrefix`

```typescript
// app.routes.ts
{
  path: 'productos',
  component: ProductosPageComponent,
},
{
  path: 'productos/:id',
  component: ProductoDetalleComponent,
}
```

```html
<!-- productos-page.component.html -->
<lib-product-grid
  [products]="productos"
  routePrefix="/productos"
  (addToCart)="cart.add($event)"
/>
<!-- Click en "Silla nórdica" → navega a /productos/silla-nordica -->
```

```typescript
// producto-detalle.component.ts
readonly route = inject(ActivatedRoute);
readonly id = this.route.snapshot.paramMap.get('id');
// busca el producto por slug o id
```

#### Ordenación disponible (`ProductSortBy`)

`'name'` (A-Z) · `'price-asc'` (menor precio) · `'price-desc'` (mayor precio) · `'rating'` (mejor valorados)

---

### `CartService` — Carrito de compra

```typescript
readonly cart = inject(CartService);

// Signals reactivos
cart.items()   // Signal<CartItem[]>
cart.count()   // Signal<number> — total de unidades
cart.total()   // Signal<number> — precio total

// Métodos
cart.add(product)                    // añade 1 unidad (o suma si ya existe)
cart.add(product, 3)                 // añade 3 unidades
cart.remove(productId)               // elimina el producto
cart.updateQuantity(productId, 2)    // cambia la cantidad
cart.clear()                         // vacía el carrito
```

#### Opciones por línea

Una línea puede llevar lo que el cliente eligió: color, complemento, dedicatoria. La
librería **no sabe qué significan**: solo los transporta hasta el checkout, que los manda
al backend en `opciones` (ver `spring-ecommerce` 0.3.0 y su `ValidadorOpciones`).

```typescript
cart.add(libro, 1, { complemento: 'Firmado' });
cart.add(pieza, 1, { color: 'Morado' });

// Para quitar o cambiar hay que decir DE QUÉ LÍNEA se trata
cart.remove(libro.id, { complemento: 'Firmado' });
cart.updateQuantity(pieza.id, 3, { color: 'Morado' });
```

**Dos líneas con el mismo producto y distintas opciones son dos líneas.** Un libro
firmado y uno sin firmar se preparan y llegan por separado, así que se cuentan por
separado. Si se agrupara solo por producto, pedir la segunda variante subiría la cantidad
de la primera — y el cliente lo descubriría al recibir el pedido.

Por eso `remove` y `updateQuantity` piden las opciones: sin ellas actúan sobre la línea
**sin opciones** de ese producto, no sobre todas.

Las tiendas que no usan opciones no notan ningún cambio: el parámetro es opcional y el
carrito guardado queda idéntico al de antes.

**Integración con la navbar:**

```typescript
// app.ts
readonly cart = inject(CartService);
```
```html
<!-- app.html -->
<lib-navbar
  [showCart]="true"
  [cartCount]="cart.count()"
  (cartClick)="abrirCarrito()"
/>
```

El badge del carrito aparece con animación cuando el count > 0, y muestra `99+` si hay más de 99 items.

**Flujo completo:**
```typescript
// demo/page.component.ts
private readonly cart = inject(CartService);

onAddToCart(product: Product): void {
  this.cart.add(product);
  // El badge de la navbar se actualiza automáticamente (signal reactivo)
}
```

---

