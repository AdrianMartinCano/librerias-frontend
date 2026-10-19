import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { TimelineData } from '@org/models';

@Component({
  selector: 'lib-event-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-timeline" [class.section--surface]="true">
      <div class="container">
        <h2 class="ev-timeline__title text-center">{{ title() }}</h2>
        <ol class="ev-timeline__list">
          @for (step of steps(); track $index) {
            <li class="ev-timeline__step">
              <span class="ev-timeline__dot">{{ step.icon || '•' }}</span>
              <span class="ev-timeline__time">{{ step.time }}</span>
              <div class="ev-timeline__body">
                <p class="ev-timeline__step-title">{{ step.title }}</p>
                @if (step.description) { <p class="ev-timeline__desc">{{ step.description }}</p> }
              </div>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .ev-timeline__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-timeline__list { max-width: 620px; margin-inline: auto; position: relative; }
    .ev-timeline__step { display: grid; grid-template-columns: 44px 72px 1fr; align-items: start;
      gap: var(--space-3); padding-block: var(--space-4); position: relative; }
    .ev-timeline__step:not(:last-child)::before { content: ''; position: absolute; left: 21px; top: 44px;
      bottom: -4px; width: 2px; background: var(--color-border); }
    .ev-timeline__dot { width: 44px; height: 44px; display: grid; place-items: center;
      border-radius: 50%; background: var(--p2); color: #fff; font-size: 1.1rem; z-index: 1; }
    .ev-timeline__time { font-weight: 700; color: var(--p2); font-variant-numeric: tabular-nums; padding-top: 10px; }
    .ev-timeline__step-title { font-size: var(--font-size-lg); color: var(--color-text); font-weight: 600; }
    .ev-timeline__desc { color: var(--color-text-secondary); margin-top: 2px; }
  `],
})
export class TimelineComponent {
  readonly data = input<TimelineData>({ steps: [] });
  readonly title = computed(() => this.data().title ?? 'Programa');
  readonly steps = computed(() => this.data().steps ?? []);
}
