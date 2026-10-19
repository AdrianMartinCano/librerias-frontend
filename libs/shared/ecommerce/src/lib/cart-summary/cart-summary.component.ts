import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CartItem, FormatService } from '@org/models';

@Component({
  selector: 'lib-cart-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-summary.component.html',
  styleUrl: './cart-summary.component.css',
})
export class CartSummaryComponent {
  readonly items          = input.required<CartItem[]>();
  readonly total          = input.required<number>();
  readonly showCheckoutBtn = input(true);
  readonly showClearBtn   = input(false);
  readonly checkoutLabel  = input('Finalizar compra →');
  readonly emptyMessage   = input('Tu carrito está vacío');

  readonly checkout   = output<void>();
  readonly clearCart  = output<void>();
  readonly itemChange = output<{ item: CartItem; quantity: number }>();
  readonly itemRemove = output<CartItem>();

  changeQty(item: CartItem, delta: number): void {
    const q = item.quantity + delta;
    if (q < 1) { this.itemRemove.emit(item); return; }
    this.itemChange.emit({ item, quantity: q });
  }

  removeItem(item: CartItem): void { this.itemRemove.emit(item); }

  private readonly fmt = inject(FormatService);

  formatPrice(price: number): string {
    return this.fmt.money(price);
  }

  /**
   * Identifica una línea: producto + opciones.
   *
   * EL TRACK NO PUEDE SER SOLO EL PRODUCTO. Con dos líneas del mismo artículo y distintas
   * opciones habría claves repetidas, y Angular reutilizaría el nodo equivocado al
   * reordenar o borrar: se vería cambiar la línea que no era.
   */
  claveDe(item: CartItem): string {
    const opts = item.options;
    if (!opts || Object.keys(opts).length === 0) {
      return item.product.id;
    }
    return item.product.id + '|' + Object.keys(opts).sort().map((k) => k + '=' + opts[k]).join('&');
  }

  /** Las opciones en una línea legible: «Firmado», «Morado · Talla M». */
  opcionesDe(item: CartItem): string | null {
    const opts = item.options;
    if (!opts || Object.keys(opts).length === 0) {
      return null;
    }
    return Object.keys(opts).sort().map((k) => opts[k]).join(' · ');
  }
}
