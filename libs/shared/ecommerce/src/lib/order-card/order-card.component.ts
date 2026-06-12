import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Order, OrderStatus } from '@org/models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pendiente',
  processing: 'En proceso',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
};

@Component({
  selector: 'lib-order-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.css',
})
export class OrderCardComponent {
  readonly order = input.required<Order>();

  readonly viewDetail  = output<Order>();
  readonly cancelOrder = output<Order>();

  statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
