import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { PaymentMethod, OrderRequest, CheckoutStep } from '@org/models';
import { DynamicFormComponent } from '@org/forms';
import { CartService } from '@org/products';
import { CheckoutService } from '../checkout.service';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';
import { FormField } from '@org/models';

@Component({
  selector: 'lib-checkout',
  standalone: true,
  imports: [CartSummaryComponent, DynamicFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  readonly successMessage = input('Recibirás un email de confirmación en breve.');
  readonly loading        = input(false);

  readonly orderPlaced = output<OrderRequest>();
  readonly cancelled   = output<void>();

  readonly checkout = inject(CheckoutService);
  readonly cart     = inject(CartService);

  readonly step            = this.checkout.step;
  readonly selectedPayment = signal<PaymentMethod | null>(null);

  readonly stepLabels: { id: CheckoutStep; num: number; label: string }[] = [
    { id: 'cart',     num: 1, label: 'Carrito' },
    { id: 'shipping', num: 2, label: 'Envío' },
    { id: 'payment',  num: 3, label: 'Pago' },
    { id: 'confirm',  num: 4, label: 'Confirmar' },
  ];

  readonly paymentOptions: { value: PaymentMethod; label: string; description: string; icon: string }[] = [
    { value: 'card',             label: 'Tarjeta de crédito / débito', description: 'Visa, Mastercard, American Express', icon: '💳' },
    { value: 'transfer',         label: 'Transferencia bancaria',      description: 'Recibirás los datos por email',       icon: '🏦' },
    { value: 'cash-on-delivery', label: 'Contra reembolso',           description: 'Paga cuando recibas el pedido',      icon: '💵' },
  ];

  readonly shippingFields: FormField[] = [
    { key: 'name',       label: 'Nombre completo',  type: 'text',   required: true },
    { key: 'email',      label: 'Email',            type: 'email',  required: true },
    { key: 'phone',      label: 'Teléfono',         type: 'tel',    required: true },
    { key: 'address',    label: 'Dirección',        type: 'text',   required: true, span: 2 },
    { key: 'postalCode', label: 'Código postal',    type: 'text',   required: true },
    { key: 'city',       label: 'Ciudad',           type: 'text',   required: true },
    { key: 'country',    label: 'País',             type: 'select', required: true,
      defaultValue: 'ES',
      options: [
        { value: 'ES', label: 'España' },
        { value: 'PT', label: 'Portugal' },
        { value: 'FR', label: 'Francia' },
        { value: 'DE', label: 'Alemania' },
        { value: 'IT', label: 'Italia' },
        { value: 'GB', label: 'Reino Unido' },
      ],
    },
  ];

  isStepDone(id: CheckoutStep): boolean {
    const order: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirm', 'success'];
    return order.indexOf(this.step()) > order.indexOf(id);
  }

  onShipping(data: Record<string, unknown>): void {
    this.checkout.setShipping(data as never);
    this.checkout.nextStep();
  }

  onPayment(): void {
    const p = this.selectedPayment();
    if (!p) return;
    this.checkout.setPayment(p);
    this.checkout.nextStep();
  }

  onConfirm(): void {
    const summary = this.checkout.orderSummary();
    if (summary) this.orderPlaced.emit(summary);
    this.checkout.nextStep();
  }

  onNewOrder(): void {
    this.checkout.reset();
  }

  paymentLabel(method: PaymentMethod): string {
    return this.paymentOptions.find((o) => o.value === method)?.label ?? method;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }
}
