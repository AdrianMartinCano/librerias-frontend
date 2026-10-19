import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { AccommodationData } from '@org/models';

@Component({
  selector: 'lib-event-accommodation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-stay">
      <div class="container">
        <h2 class="ev-stay__title text-center">{{ title() }}</h2>
        <div class="ev-stay__grid">
          @for (item of items(); track $index) {
            <article class="ev-stay__card">
              <h3 class="ev-stay__name">{{ item.name }}</h3>
              @if (item.distance) { <p class="ev-stay__distance">📍 {{ item.distance }}</p> }
              @if (item.description) { <p class="ev-stay__desc">{{ item.description }}</p> }
              <div class="ev-stay__actions">
                @if (item.phone) { <a class="ev-stay__link" [href]="'tel:' + item.phone">📞 {{ item.phone }}</a> }
                @if (item.url) { <a class="ev-stay__link" [href]="item.url" target="_blank" rel="noopener">Ver web ↗</a> }
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ev-stay__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-stay__grid { display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .ev-stay__card { padding: var(--space-6); background: var(--color-background);
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
    .ev-stay__name { font-family: var(--heading-font, inherit); color: var(--color-text); }
    .ev-stay__distance { color: var(--p2); font-size: var(--font-size-sm); margin-top: var(--space-2); }
    .ev-stay__desc { color: var(--color-text-secondary); margin-top: var(--space-3); }
    .ev-stay__actions { display: flex; gap: var(--space-4); margin-top: var(--space-4); flex-wrap: wrap; }
    .ev-stay__link { color: var(--p2); font-weight: 600; }
  `],
})
export class AccommodationComponent {
  readonly data = input<AccommodationData>({ items: [] });
  readonly title = computed(() => this.data().title ?? 'Dónde alojarse');
  readonly items = computed(() => this.data().items ?? []);
}
