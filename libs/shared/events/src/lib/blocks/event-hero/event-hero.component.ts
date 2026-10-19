import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { EventHeroData } from '@org/models';
import { EventContext } from '../../event-context';
import { formatEventDate } from '../../event-format.util';

@Component({
  selector: 'lib-event-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <header
      class="ev-hero"
      [class.ev-hero--photo]="image()"
      [style.background-image]="image() ? 'url(' + image() + ')' : null"
    >
      @if (image()) { <div class="ev-hero__overlay"></div> }
      <div class="ev-hero__content container">
        @if (tagline()) { <p class="ev-hero__tagline">{{ tagline() }}</p> }
        <h1 class="ev-hero__title">{{ title() }}</h1>
        @if (subtitle()) { <p class="ev-hero__subtitle">{{ subtitle() }}</p> }
        @if (showDate()) {
          <p class="ev-hero__date">{{ formattedDate() }}</p>
        }
      </div>
    </header>
  `,
  styles: [`
    .ev-hero { position: relative; display: flex; align-items: center; justify-content: center;
      min-height: 78vh; text-align: center; background: var(--p1); color: #fff;
      background-size: cover; background-position: center; }
    .ev-hero--photo { color: #fff; }
    .ev-hero__overlay { position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.55)); }
    .ev-hero__content { position: relative; padding-block: var(--space-16); animation: lib-fade-in .8s ease both; }
    .ev-hero__tagline { text-transform: uppercase; letter-spacing: .28em; font-size: var(--font-size-sm);
      color: var(--p2); font-weight: 600; margin-bottom: var(--space-4); }
    .ev-hero__title { font-family: var(--heading-font, inherit); color: #fff;
      font-size: clamp(2.5rem, 8vw, 5rem); line-height: 1.05; }
    .ev-hero__subtitle { color: rgba(255,255,255,.9); font-size: var(--font-size-xl); margin-top: var(--space-4); }
    .ev-hero__date { margin-top: var(--space-6); font-size: var(--font-size-lg); letter-spacing: .04em;
      color: rgba(255,255,255,.92); }
  `],
})
export class EventHeroComponent {
  readonly data = input<EventHeroData>({});
  readonly ctx = input.required<EventContext>();

  readonly title = computed(() => this.data().title ?? this.ctx().title);
  readonly subtitle = computed(() => this.data().subtitle ?? this.ctx().subtitle);
  readonly tagline = computed(() => this.data().tagline);
  readonly image = computed(() => this.data().image);
  readonly showDate = computed(() => this.data().showDate ?? true);
  readonly formattedDate = computed(() => formatEventDate(this.ctx().date, this.ctx().locale));
}
