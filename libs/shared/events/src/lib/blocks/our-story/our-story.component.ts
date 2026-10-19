import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { OurStoryData } from '@org/models';

@Component({
  selector: 'lib-event-our-story',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-story">
      <div class="container">
        <h2 class="ev-story__title text-center">{{ title() }}</h2>
        @if (data().image || data().text) {
          <div class="ev-story__intro">
            @if (data().image) { <img class="ev-story__img" [src]="data().image" alt="" loading="lazy" /> }
            @if (data().text) { <p class="ev-story__text">{{ data().text }}</p> }
          </div>
        }
        @if (milestones().length) {
          <ol class="ev-story__milestones">
            @for (m of milestones(); track $index) {
              <li class="ev-story__milestone">
                <span class="ev-story__date">{{ m.date }}</span>
                <div class="ev-story__body">
                  <p class="ev-story__m-title">{{ m.title }}</p>
                  @if (m.description) { <p class="ev-story__desc">{{ m.description }}</p> }
                </div>
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
  styles: [`
    .ev-story__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-story__intro { display: grid; gap: var(--space-8); align-items: center; max-width: 900px; margin-inline: auto;
      grid-template-columns: 1fr; }
    @media (min-width: 768px) { .ev-story__intro:has(.ev-story__img) { grid-template-columns: 1fr 1fr; } }
    .ev-story__img { width: 100%; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
    .ev-story__text { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
    .ev-story__milestones { max-width: 620px; margin: var(--space-12) auto 0; }
    .ev-story__milestone { display: grid; grid-template-columns: 96px 1fr; gap: var(--space-4);
      padding-block: var(--space-4); border-left: 2px solid var(--color-border); padding-left: var(--space-6);
      margin-left: 40px; }
    .ev-story__date { font-weight: 700; color: var(--p2); }
    .ev-story__m-title { font-size: var(--font-size-lg); color: var(--color-text); font-weight: 600; }
    .ev-story__desc { color: var(--color-text-secondary); margin-top: 2px; }
  `],
})
export class OurStoryComponent {
  readonly data = input<OurStoryData>({});
  readonly title = computed(() => this.data().title ?? 'Nuestra historia');
  readonly milestones = computed(() => this.data().milestones ?? []);
}
