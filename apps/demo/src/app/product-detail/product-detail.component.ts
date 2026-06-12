import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@org/ui';
import { CartService } from '@org/products';
import { Product } from '@org/models';

/* Productos compartidos con la demo — en un proyecto real vendrían de una API */
export const DEMO_PRODUCTS: Product[] = [
  { id: '1', slug: 'silla-nordica', name: 'Silla nórdica', description: 'Diseño escandinavo con patas de madera maciza y asiento tapizado en tela de alta calidad. Perfecta para salón o comedor.', price: 299, category: 'Mobiliario', imageUrl: 'https://picsum.photos/seed/silla/800/600', inStock: true, rating: 4.5, reviewCount: 28, badge: 'Nuevo' },
  { id: '2', slug: 'mesa-escritorio', name: 'Mesa escritorio', description: 'Superficie amplia de 140×70cm con cajón lateral y patas metálicas ajustables en altura.', price: 189, originalPrice: 250, category: 'Mobiliario', imageUrl: 'https://picsum.photos/seed/mesa/800/600', inStock: true, rating: 4.2, reviewCount: 15, badge: '-24%' },
  { id: '3', slug: 'lampara-arco', name: 'Lámpara de arco', description: 'Brazo articulado de 180cm con pantalla de tela natural y base de mármol macizo. Ilumina toda la estancia.', price: 129, category: 'Iluminación', imageUrl: 'https://picsum.photos/seed/lampara/800/600', inStock: true, rating: 4.8, reviewCount: 42 },
  { id: '4', slug: 'estanteria-flotante', name: 'Estantería flotante', description: 'Tres baldas de 80cm en madera de pino con soportes de acero ocultos. Capacidad 15kg por balda.', price: 89, category: 'Almacenaje', imageUrl: 'https://picsum.photos/seed/estante/800/600', inStock: false, rating: 4.0, reviewCount: 9 },
  { id: '5', slug: 'sofa-3-plazas', name: 'Sofá 3 plazas', description: 'Tapizado de microfibra lavable en varios colores. Estructura de madera de haya y espuma de alta densidad.', price: 599, category: 'Mobiliario', imageUrl: 'https://picsum.photos/seed/sofa/800/600', inStock: true, rating: 4.7, reviewCount: 63, badge: 'Bestseller' },
  { id: '6', slug: 'espejo-redondo', name: 'Espejo redondo', description: 'Marco metálico acabado dorado. 60cm de diámetro. Incluye kit de anclaje y nivel.', price: 75, originalPrice: 95, category: 'Decoración', imageUrl: 'https://picsum.photos/seed/espejo/800/600', inStock: true, rating: 4.3, reviewCount: 21, badge: '-21%' },
  { id: '7', slug: 'alfombra-geometrica', name: 'Alfombra geométrica', description: 'Lana 100% natural, tejida a mano en Nepal. Medidas 160×230cm. Resistente y fácil de limpiar.', price: 245, category: 'Textil', imageUrl: 'https://picsum.photos/seed/alfombra/800/600', inStock: true, rating: 4.6, reviewCount: 34 },
  { id: '8', slug: 'macetero-ceramico', name: 'Macetero cerámico', description: 'Acabado mate en 6 colores. Diámetro 25cm. Perfecto para plantas de interior.', price: 35, category: 'Decoración', imageUrl: 'https://picsum.photos/seed/maceta/800/600', inStock: true, rating: 3.9, reviewCount: 7 },
  { id: '9', slug: 'lampara-pie', name: 'Lámpara de pie', description: 'Estructura de metal negro mate con pantalla de papel pergamino. Altura ajustable 140-170cm.', price: 159, category: 'Iluminación', imageUrl: 'https://picsum.photos/seed/pielampa/800/600', inStock: false, rating: 4.1, reviewCount: 18 },
];

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pd container py-12">
      <a class="pd__back" [routerLink]="'/demo'">
        ← Volver al catálogo
      </a>

      @if (product()) {
        <div class="pd__layout">
          <div class="pd__image">
            <img [src]="product()!.imageUrl" [alt]="product()!.name" class="pd__img" />
            @if (product()!.badge && product()!.inStock) {
              <span class="pd__badge">{{ product()!.badge }}</span>
            }
          </div>

          <div class="pd__info">
            <p class="pd__category">{{ product()!.category }}</p>
            <h1 class="pd__name">{{ product()!.name }}</h1>

            @if (product()!.rating) {
              <div class="pd__rating">
                <span class="pd__stars">{{ '★'.repeat(Math.round(product()!.rating)) }}{{ '☆'.repeat(5 - Math.round(product()!.rating)) }}</span>
                <span class="pd__reviews">{{ product()!.rating }} / 5 ({{ product()!.reviewCount }} reseñas)</span>
              </div>
            }

            <p class="pd__desc">{{ product()!.description }}</p>

            <div class="pd__price-row">
              @if (product()!.originalPrice && product()!.originalPrice! > product()!.price) {
                <span class="pd__original">{{ formatPrice(product()!.originalPrice!) }}</span>
              }
              <span class="pd__price">{{ formatPrice(product()!.price) }}</span>
            </div>

            @if (product()!.inStock) {
              <lib-button variant="accent" size="lg" [full]="true" (clicked)="addToCart()">
                Añadir al carrito
              </lib-button>
              <p class="pd__stock">✓ En stock — envío en 24-48h</p>
            } @else {
              <lib-button variant="secondary" size="lg" [full]="true" [disabled]="true">
                Agotado
              </lib-button>
            }
          </div>
        </div>
      } @else {
        <div class="pd__not-found">
          <p>Producto no encontrado.</p>
          <lib-button variant="accent" [routerLink]="'/demo'">Volver al catálogo</lib-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .pd__back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-accent);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-8);
    }
    .pd__back:hover { text-decoration: underline; }

    .pd__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-8);
    }
    @media (min-width: 768px) {
      .pd__layout { grid-template-columns: 1fr 1fr; gap: var(--space-12); }
    }

    .pd__image { position: relative; border-radius: var(--radius-xl); overflow: hidden; aspect-ratio: 4/3; background: var(--color-surface); }
    .pd__img   { width: 100%; height: 100%; object-fit: cover; }
    .pd__badge {
      position: absolute; top: var(--space-3); left: var(--space-3);
      background: var(--color-accent); color: #fff;
      font-size: var(--font-size-sm); font-weight: 700;
      padding: var(--space-1) var(--space-3); border-radius: var(--radius-full);
    }

    .pd__info { display: flex; flex-direction: column; gap: var(--space-4); }
    .pd__category { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-accent); text-transform: uppercase; letter-spacing: .06em; margin: 0; }
    .pd__name  { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-text); margin: 0; line-height: 1.2; }
    .pd__rating { display: flex; align-items: center; gap: var(--space-2); }
    .pd__stars  { color: #f59e0b; font-size: var(--font-size-lg); }
    .pd__reviews { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .pd__desc  { color: var(--color-text-secondary); line-height: var(--line-height-relaxed); margin: 0; }

    .pd__price-row { display: flex; align-items: baseline; gap: var(--space-3); }
    .pd__original  { font-size: var(--font-size-lg); color: var(--color-text-muted); text-decoration: line-through; }
    .pd__price     { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--color-text); }

    .pd__stock { font-size: var(--font-size-sm); color: var(--color-success); margin: 0; }
    .pd__not-found { text-align: center; padding: var(--space-16); color: var(--color-text-muted); }
  `],
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cart  = inject(CartService);

  readonly Math = Math;

  readonly product = computed<Product | undefined>(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return DEMO_PRODUCTS.find((p) => p.slug === id || p.id === id);
  });

  addToCart(): void {
    const p = this.product();
    if (p) this.cart.add(p);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }
}
