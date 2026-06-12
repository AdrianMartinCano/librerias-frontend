import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@org/models';

@Component({
  selector: 'lib-product-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  readonly product        = input.required<Product>();
  readonly showRating     = input(true);
  readonly showAddToCart  = input(true);
  readonly addToCartLabel = input('Añadir');
  readonly orientation    = input<'vertical' | 'horizontal'>('vertical');
  /**
   * Ruta interna a la página de detalle del producto.
   * Si se provee, la imagen y el título se convierten en enlace.
   * Usa product.slug si existe, o product.id como fallback.
   *
   * Ejemplo: [routerLink]="'/productos/' + (product.slug || product.id)"
   * O más simple: usa [routePrefix] en lib-product-grid.
   */
  readonly routerLink     = input<string | null>(null);

  readonly cardClick  = output<Product>();
  readonly addToCart  = output<Product>();

  readonly stars = computed(() => {
    const r    = this.product().rating ?? 0;
    const full = Math.floor(r);
    const half = r % 1 >= 0.5;
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < full,
      half:   i === full && half,
    }));
  });

  readonly categoryName = computed(() => {
    const cat = this.product().category;
    if (!cat) return '';
    return typeof cat === 'string' ? cat : (cat as any).name ?? '';
  });

  readonly discount = computed(() => {
    const p = this.product();
    if (!p.originalPrice || p.originalPrice <= p.price) return null;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  });

  onCardClick(): void {
    if (!this.routerLink()) this.cardClick.emit(this.product());
  }

  onAddToCart(e: Event): void {
    e.stopPropagation();
    this.addToCart.emit(this.product());
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }
}
