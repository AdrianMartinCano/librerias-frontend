import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { EventDetailsData, EventDetailsItem } from '@org/models';
import { EventContext } from '../../event-context';
import { formatEventDate, formatEventTime } from '../../event-format.util';

@Component({
  selector: 'lib-event-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-details">
      <div class="container">
        <h2 class="ev-details__title text-center">{{ title() }}</h2>
        <div class="ev-details__grid">
          @for (item of items(); track $index) {
            <div class="ev-details__item">
              @if (item.icon) { <span class="ev-details__icon">{{ item.icon }}</span> }
              <div>
                <p class="ev-details__label">{{ item.label }}</p>
                <p class="ev-details__value">{{ item.value }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ev-details__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-details__grid { display: grid; gap: var(--space-6);
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .ev-details__item { display: flex; gap: var(--space-4); align-items: flex-start;
      padding: var(--space-6); background: var(--color-background); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
    .ev-details__icon { font-size: 1.8rem; line-height: 1; }
    .ev-details__label { text-transform: uppercase; letter-spacing: .1em; font-size: var(--font-size-xs);
      color: var(--color-text-muted); font-weight: 600; }
    .ev-details__value { font-size: var(--font-size-lg); color: var(--color-text); margin-top: 2px; }
  `],
})
export class EventDetailsComponent {
  readonly data = input<EventDetailsData>({ items: [] });
  readonly ctx = input.required<EventContext>();

  readonly title = computed(() => this.data().title ?? 'Detalles');
  readonly items = computed<EventDetailsItem[]>(() => {
    const given = this.data().items ?? [];
    if (given.length) return given;
    // Fallback razonable a partir del contexto si no se dan items.
    const c = this.ctx();
    const fallback: EventDetailsItem[] = [
      { icon: '📅', label: 'Cuándo', value: formatEventDate(c.date, c.locale) },
      { icon: '🕒', label: 'Hora', value: formatEventTime(c.date, c.locale) },
    ];
    if (c.venue) fallback.push({ icon: '📍', label: 'Dónde', value: c.venue.name });
    return fallback;
  });
}
