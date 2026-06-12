import { Injectable, signal, computed, inject } from '@angular/core';
import { ShippingAddress, PaymentMethod, CheckoutStep, OrderRequest } from '@org/models';
import { CartService } from '@org/products';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cart = inject(CartService);

  readonly step     = signal<CheckoutStep>('cart');
  readonly shipping = signal<ShippingAddress | null>(null);
  readonly payment  = signal<PaymentMethod | null>(null);

  readonly canProceed = computed(() => {
    switch (this.step()) {
      case 'cart':     return this.cart.count() > 0;
      case 'shipping': return this.shipping() !== null;
      case 'payment':  return this.payment() !== null;
      default:         return true;
    }
  });

  readonly orderSummary = computed<OrderRequest | null>(() => {
    const s = this.shipping();
    const p = this.payment();
    if (!s || !p) return null;
    return { items: this.cart.items(), shipping: s, payment: p, total: this.cart.total() };
  });

  setShipping(data: ShippingAddress): void { this.shipping.set(data); }
  setPayment(method: PaymentMethod): void  { this.payment.set(method); }

  nextStep(): void {
    const order: Record<CheckoutStep, CheckoutStep> = {
      cart: 'shipping', shipping: 'payment', payment: 'confirm', confirm: 'success', success: 'success',
    };
    this.step.set(order[this.step()]);
  }

  prevStep(): void {
    const back: Record<CheckoutStep, CheckoutStep> = {
      cart: 'cart', shipping: 'cart', payment: 'shipping', confirm: 'payment', success: 'success',
    };
    this.step.set(back[this.step()]);
  }

  reset(): void {
    this.step.set('cart');
    this.shipping.set(null);
    this.payment.set(null);
    this.cart.clear();
  }
}
