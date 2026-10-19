import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { Order, OrderStatus, FormatService } from '@org/models';

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

  private readonly fmt = inject(FormatService);

  formatPrice(price: number): string {
    return this.fmt.money(price);
  }

  formatDate(iso: string): string {
    return this.fmt.date(iso, { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
