# @adrianmartincano/ng-ecommerce

Flujo de compra completo para Angular: carrito editable (lib-cart), checkout en 5 pasos (lib-checkout) e historial de pedidos (lib-order-history). Se apoya en el CartService de @adrianmartincano/ng-products.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-ecommerce
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |
| `@adrianmartincano/ng-products` | `>=0.3.7` |
| `@adrianmartincano/ng-forms` | `>=0.3.7` |

---

> Asegúrate de tener cargado el theme en tu `styles.css` global — los componentes usan sus variables CSS:
>
> ```css
> @import '@adrianmartincano/ng-theme/index.css';
> ```

---

## Ecommerce (`@adrianmartincano/ng-ecommerce`)

Flujo de compra completo: carrito editable, checkout multi-paso y tarjetas de pedido.

```typescript
import { CartSummaryComponent, CheckoutComponent, OrderCardComponent, CheckoutService } from '@adrianmartincano/ng-ecommerce';
import { Order, OrderRequest, ShippingAddress, PaymentMethod } from '@adrianmartincano/ng-models';
```

---

### `<lib-cart-summary>` — Resumen del carrito

Muestra los items del carrito con edición de cantidades y botón de checkout.

```html
<lib-cart-summary
  [items]="cart.items()"
  [total]="cart.total()"
  [showClearBtn]="true"
  checkoutLabel="Finalizar compra →"
  (checkout)="irAlCheckout()"
  (clearCart)="cart.clear()"
  (itemChange)="cart.updateQuantity($event.item.product.id, $event.quantity)"
  (itemRemove)="cart.remove($event.product.id)"
/>
```

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `items` | `CartItem[]` | — | Items del carrito (obligatorio) |
| `total` | `number` | — | Total calculado (obligatorio) |
| `showCheckoutBtn` | `boolean` | `true` | Muestra el botón de checkout |
| `showClearBtn` | `boolean` | `false` | Muestra el botón "Vaciar carrito" |
| `checkoutLabel` | `string` | `'Finalizar compra →'` | Texto del botón |
| `emptyMessage` | `string` | `'Tu carrito está vacío'` | Mensaje cuando no hay items |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `checkout` | `void` | Clic en "Finalizar compra" |
| `clearCart` | `void` | Clic en "Vaciar carrito" |
| `itemChange` | `{ item: CartItem; quantity: number }` | Cambio de cantidad de un item |
| `itemRemove` | `CartItem` | Eliminar un item |

---

### `<lib-checkout>` — Proceso de compra completo

Componente multi-paso: Carrito → Envío → Pago → Confirmación → Éxito. Usa `CartService` y `CheckoutService` internamente.

```html
<lib-checkout
  successMessage="Recibirás un email de confirmación."
  [loading]="procesando"
  (orderPlaced)="onPedido($event)"
  (cancelled)="volver()"
/>
```

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `successMessage` | `string` | texto por defecto | Mensaje en el paso de éxito |
| `loading` | `boolean` | `false` | Spinner en el botón de confirmar |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `orderPlaced` | `OrderRequest` | Emite cuando el usuario confirma el pedido. Aquí llamas a tu API. |
| `cancelled` | `void` | Usuario canceló el proceso |

#### Pasos del checkout

1. **Carrito** — resumen con edición de cantidades
2. **Envío** — formulario: nombre, email, teléfono, dirección, ciudad, CP, país
3. **Pago** — tarjeta / transferencia / contra reembolso
4. **Confirmación** — resumen completo antes de confirmar
5. **Éxito** — mensaje de pedido realizado

#### Flujo típico

```typescript
onPedido(order: OrderRequest): void {
  this.pedidosService.crear(order).subscribe({
    next: () => this.router.navigate(['/mis-pedidos']),
    error: () => this.toast.error('Error al procesar el pedido'),
  });
}
```

---

### `<lib-order-card>` — Tarjeta de pedido

Para mostrar pedidos en el historial del cliente.

```html
@for (order of misPedidos; track order.id) {
  <lib-order-card
    [order]="order"
    (viewDetail)="verDetalle($event)"
    (cancelOrder)="cancelar($event)"
  />
}
```

#### Inputs / Outputs

| Input | Tipo | Descripción |
|---|---|---|
| `order` | `Order` | El pedido a mostrar (obligatorio) |

| Output | Tipo | Descripción |
|---|---|---|
| `viewDetail` | `Order` | Clic en "Ver detalle" |
| `cancelOrder` | `Order` | Clic en "Cancelar" (solo visible si `status === 'pending'`) |

#### Estados del pedido (`OrderStatus`)

| Estado | Badge | Descripción |
|---|---|---|
| `pending` | Amarillo | Pendiente de proceso |
| `processing` | Azul | En preparación |
| `shipped` | Morado | Enviado |
| `delivered` | Verde | Entregado |
| `cancelled` | Rojo | Cancelado |

---

### `CheckoutService` — Estado del checkout

```typescript
readonly checkout = inject(CheckoutService);

checkout.step()          // Signal<CheckoutStep> — paso actual
checkout.shipping()      // Signal<ShippingAddress | null>
checkout.payment()       // Signal<PaymentMethod | null>
checkout.canProceed()    // Signal<boolean>
checkout.orderSummary()  // Signal<OrderRequest | null>

checkout.setShipping(data)
checkout.setPayment(method)
checkout.nextStep()
checkout.prevStep()
checkout.reset()
```

### Modelos

```typescript
interface ShippingAddress {
  name: string; email: string; phone: string;
  address: string; city: string; postalCode: string; country: string;
}

type PaymentMethod = 'card' | 'transfer' | 'cash-on-delivery';
type OrderStatus   = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string; items: CartItem[]; shipping: ShippingAddress;
  payment: PaymentMethod; total: number; status: OrderStatus;
  createdAt: string; trackingCode?: string;
}

interface OrderRequest { items: CartItem[]; shipping: ShippingAddress; payment: PaymentMethod; total: number; }
```

---

