import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { Product, ProductSortBy } from '@org/models';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'lib-product-grid',
  standalone: true,
  imports: [ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.css',
})
export class ProductGridComponent {
  readonly products        = input.required<Product[]>();
  readonly cols            = input<2 | 3 | 4>(3);
  readonly showSearch      = input(false);
  readonly showFilters     = input(false);
  readonly showSort        = input(false);
  readonly showRating      = input(true);
  readonly showAddToCart   = input(true);
  readonly addToCartLabel  = input('Añadir');
  readonly searchPlaceholder = input('Buscar productos...');
  readonly emptyMessage    = input('No hay productos disponibles');
  readonly loading         = input(false);
  /**
   * Prefijo de ruta para la página de detalle.
   * El grid concatena: routePrefix + '/' + (product.slug || product.id)
   * Ejemplo: '/productos' → '/productos/silla-nordica'
   * Si no se pasa, las tarjetas no tienen enlace (usan (cardClick)).
   */
  readonly routePrefix     = input<string>('');

  readonly productClick = output<Product>();
  readonly addToCart    = output<Product>();

  readonly searchQuery      = signal('');
  readonly selectedCategory = signal('');
  readonly sortBy           = signal<ProductSortBy>('name');

  readonly skeletons = Array.from({ length: 6 });

  private catName(cat: any): string {
    if (!cat) return '';
    return typeof cat === 'string' ? cat : (cat?.name ?? '');
  }

  readonly categories = computed(() =>
    [...new Set(this.products().map((p) => this.catName(p.category)))].filter(Boolean).sort()
  );

  readonly filteredProducts = computed(() => {
    let list = this.products();
    const q   = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    if (q)   list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      this.catName(p.category).toLowerCase().includes(q)
    );
    if (cat) list = list.filter(p => this.catName(p.category) === cat);

    switch (this.sortBy()) {
      case 'price-asc':  return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...list].sort((a, b) => b.price - a.price);
      case 'rating':     return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:           return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
  });

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  onCategoryChange(e: Event): void {
    this.selectedCategory.set((e.target as HTMLSelectElement).value);
  }

  onSortChange(e: Event): void {
    this.sortBy.set((e.target as HTMLSelectElement).value as ProductSortBy);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
  }

  productRoute(product: Product): string | null {
    const prefix = this.routePrefix();
    if (!prefix) return null;
    const segment = product.slug || product.id;
    return `${prefix}/${segment}`;
  }
}
