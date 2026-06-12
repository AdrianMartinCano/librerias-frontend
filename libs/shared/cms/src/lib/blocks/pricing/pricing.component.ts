import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PricingData } from '@org/models';

@Component({
  selector: 'lib-cms-pricing',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './pricing.component.css',
  template: `
    <section class="section section--surface">
      <div class="container">
        @if (data().title) {
          <div class="cms-pricing__header">
            <h2 class="cms-pricing__title">{{ data().title }}</h2>
            @if (data().subtitle) { <p class="cms-pricing__subtitle">{{ data().subtitle }}</p> }
          </div>
        }
        <div class="cms-pricing__grid" [class.cms-pricing__grid--3]="data().plans.length === 3">
          @for (plan of data().plans; track plan.name) {
            <div class="cms-pricing__plan" [class.cms-pricing__plan--highlighted]="plan.highlighted">
              @if (plan.badge) { <span class="cms-pricing__badge">{{ plan.badge }}</span> }
              <h3 class="cms-pricing__plan-name">{{ plan.name }}</h3>
              @if (plan.description) { <p class="cms-pricing__plan-desc">{{ plan.description }}</p> }
              <div class="cms-pricing__price-row">
                <span class="cms-pricing__price">{{ formatPrice(plan.price) }}</span>
                @if (plan.period) { <span class="cms-pricing__period">/ {{ plan.period }}</span> }
              </div>
              <ul class="cms-pricing__features">
                @for (f of plan.features; track f) {
                  <li class="cms-pricing__feature">✓ {{ f }}</li>
                }
              </ul>
              @if (plan.cta) {
                @if (plan.cta.external) {
                  <a class="cms-pricing__btn" [class.cms-pricing__btn--accent]="plan.highlighted" [href]="plan.cta.href" target="_blank" rel="noopener">{{ plan.cta.label }}</a>
                } @else {
                  <a class="cms-pricing__btn" [class.cms-pricing__btn--accent]="plan.highlighted" [routerLink]="plan.cta.href">{{ plan.cta.label }}</a>
                }
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class PricingComponent {
  readonly data = input.required<PricingData>();

  formatPrice(price: number | string): string {
    if (typeof price === 'string') return price;
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  }
}

