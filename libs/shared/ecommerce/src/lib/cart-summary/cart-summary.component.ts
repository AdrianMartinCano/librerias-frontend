import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CartItem } from '@org/models';

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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }
}
