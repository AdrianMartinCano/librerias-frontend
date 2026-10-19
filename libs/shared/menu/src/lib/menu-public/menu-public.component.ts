import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { Allergen, Carta, CategoryIcon, DailyMenu, MenuItem } from '@org/models';
import { ALLERGEN_LABEL, CATEGORY_ICON, FONT_STACK, formatPrice } from '../menu-format';

/**
 * Carta pública themeable, **tipográfica** (sin imágenes). Renderiza el menú del día arriba (si lo
 * hay) y la carta debajo, aplicando la presentación (fuente/color/layout) vía variables CSS. Componente
 * controlado: el host pasa `carta` (GET /api/menu) y opcionalmente `dailyMenus` (GET /api/menu/daily).
 */
@Component({
  selector: 'lib-menu-public',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="lib-menu"
      [class.lib-menu--cards]="layout() === 'CARDS'"
      [class.lib-menu--columns]="layout() === 'COLUMNS'"
      [style.--menu-heading-font]="headingFont()"
      [style.--menu-body-font]="bodyFont()"
      [style.--menu-accent]="accent()"
    >
      @if (dailyMenus().length > 0) {
        <section class="lib-menu__daily">
          @for (d of dailyMenus(); track d.id) {
            <article class="lib-menu__daily-card">
              <header class="lib-menu__daily-head">
                <h2 class="lib-menu__daily-name">{{ d.name }}</h2>
                @if (showPrices()) { <span class="lib-menu__daily-price">{{ price(d.price) }}</span> }
              </header>
              @if (d.description) { <p class="lib-menu__daily-desc">{{ d.description }}</p> }
              @for (c of d.courses; track c.id) {
                <div class="lib-menu__course">
                  <h3 class="lib-menu__course-name">{{ c.name }}</h3>
                  <ul class="lib-menu__course-list">
                    @for (o of c.options; track o.id) {
                      <li>
                        {{ o.name }}
                        @if (o.supplement) { <span class="lib-menu__supp">(+{{ price(o.supplement) }})</span> }
                        @if (showAllergens() && o.allergens.length) {
                          <span class="lib-menu__allergens">{{ allergens(o.allergens) }}</span>
                        }
                      </li>
                    }
                  </ul>
                </div>
              }
            </article>
          }
        </section>
      }

      @for (cat of carta().categories; track cat.id) {
        <section class="lib-menu__cat">
          <h2 class="lib-menu__cat-name">
            @if (icon(cat.icon)) { <span class="lib-menu__cat-icon">{{ icon(cat.icon) }}</span> }
            {{ cat.name }}
          </h2>
          @if (cat.description) { <p class="lib-menu__cat-desc">{{ cat.description }}</p> }

          <ul class="lib-menu__items">
            @for (item of cat.items; track item.id) {
              <li class="lib-menu__item">
                <div class="lib-menu__item-head">
                  <span class="lib-menu__item-name">
                    {{ item.name }}
                    @if (item.badge) { <span class="lib-menu__badge">{{ item.badge }}</span> }
                    {{ diet(item) }}
                  </span>
                  @if (showPrices()) {
                    <span class="lib-menu__item-price">{{ priceLabel(item) }}</span>
                  }
                </div>
                @if (item.description) { <p class="lib-menu__item-desc">{{ item.description }}</p> }
                @if (showAllergens() && item.allergens.length) {
                  <p class="lib-menu__allergens">{{ allergens(item.allergens) }}</p>
                }
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    .lib-menu {
      font-family: var(--menu-body-font, var(--font-family-base, sans-serif));
      color: var(--color-text, #1a1a1a);
      display: flex; flex-direction: column; gap: var(--space-8, 2rem);
      max-width: 760px; margin: 0 auto;
    }
    .lib-menu--columns .lib-menu__items { columns: 2; column-gap: var(--space-8, 2rem); }
    .lib-menu--cards .lib-menu__items { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3, .75rem); }
    .lib-menu--cards .lib-menu__item { border: 1px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem); padding: var(--space-3, .75rem); }

    .lib-menu h2, .lib-menu h3 { font-family: var(--menu-heading-font, var(--font-family-heading, serif)); }

    .lib-menu__cat-name { font-size: var(--font-size-xl, 1.5rem); margin: 0 0 var(--space-1, .25rem); color: var(--menu-accent, var(--color-accent, #8a5a2b)); border-bottom: 2px solid var(--menu-accent, var(--color-accent, #8a5a2b)); padding-bottom: var(--space-1, .25rem); }
    .lib-menu__cat-icon { margin-right: .35rem; }
    .lib-menu__cat-desc { color: var(--color-text-secondary, #595959); font-size: var(--font-size-sm, .875rem); margin: .25rem 0 var(--space-3, .75rem); }

    .lib-menu__items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-menu__item { break-inside: avoid; }
    .lib-menu__item-head { display: flex; justify-content: space-between; gap: var(--space-3, .75rem); align-items: baseline; }
    .lib-menu__item-name { font-weight: var(--font-weight-medium, 500); }
    .lib-menu__item-price { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--color-text, #1a1a1a); }
    .lib-menu__item-desc { color: var(--color-text-secondary, #595959); font-size: var(--font-size-sm, .875rem); margin: .15rem 0 0; }
    .lib-menu__badge { font-size: var(--font-size-xs, .75rem); background: var(--menu-accent, var(--color-accent, #8a5a2b)); color: #fff; padding: .05rem .4rem; border-radius: var(--radius-sm, .25rem); margin-left: .35rem; }
    .lib-menu__allergens { font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); font-style: italic; margin: .15rem 0 0; }
    .lib-menu__supp { font-size: var(--font-size-xs, .75rem); color: var(--color-text-secondary, #595959); }

    .lib-menu__daily-card { border: 1.5px solid var(--menu-accent, var(--color-accent, #8a5a2b)); border-radius: var(--radius-lg, .75rem); padding: var(--space-5, 1.25rem); background: var(--color-surface, #fafafa); }
    .lib-menu__daily-head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3, .75rem); }
    .lib-menu__daily-name { margin: 0; font-size: var(--font-size-xl, 1.5rem); color: var(--menu-accent, var(--color-accent, #8a5a2b)); }
    .lib-menu__daily-price { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .lib-menu__daily-desc { color: var(--color-text-secondary, #595959); font-size: var(--font-size-sm, .875rem); margin: .25rem 0 var(--space-3, .75rem); }
    .lib-menu__course { margin-top: var(--space-3, .75rem); }
    .lib-menu__course-name { margin: 0 0 .25rem; font-size: var(--font-size-base, 1rem); }
    .lib-menu__course-list { margin: 0; padding-left: var(--space-5, 1.25rem); display: flex; flex-direction: column; gap: .15rem; }
  `],
})
export class MenuPublicComponent {
  readonly carta = input.required<Carta>();
  readonly dailyMenus = input<DailyMenu[]>([]);

  readonly headingFont = computed(() => FONT_STACK[this.carta().presentation.headingFont]);
  readonly bodyFont    = computed(() => FONT_STACK[this.carta().presentation.bodyFont]);
  readonly accent      = computed(() => this.carta().presentation.accentColor);
  readonly layout      = computed(() => this.carta().presentation.layout);
  readonly showPrices  = computed(() => this.carta().presentation.showPrices);
  readonly showAllergens = computed(() => this.carta().presentation.showAllergens);

  icon(i: CategoryIcon): string { return CATEGORY_ICON[i]; }

  allergens(list: Allergen[]): string {
    return 'Contiene: ' + list.map(a => ALLERGEN_LABEL[a]).join(', ');
  }

  price(amount: number): string {
    return formatPrice(amount, this.carta().presentation.currency);
  }

  /** "12,00 €" o "Tapa 3,50 € · Ración 9,00 €" según tenga raciones. */
  priceLabel(item: MenuItem): string {
    if (item.portions.length > 0) {
      return item.portions.map(p => `${p.label} ${this.price(p.amount)}`).join(' · ');
    }
    return item.price != null ? this.price(item.price) : '';
  }

  /** Iconos dietéticos compactos. */
  diet(item: MenuItem): string {
    const tags: string[] = [];
    if (item.vegan) tags.push('🌱');
    else if (item.vegetarian) tags.push('🥬');
    if (item.glutenFree) tags.push('🚫🌾');
    if (item.spicy) tags.push('🌶️');
    return tags.join(' ');
  }
}
