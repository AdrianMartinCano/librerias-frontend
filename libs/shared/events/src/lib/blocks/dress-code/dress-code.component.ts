import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { DressCodeData } from '@org/models';

@Component({
  selector: 'lib-event-dress-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-dress">
      <div class="container text-center">
        <h2 class="ev-dress__title">{{ title() }}</h2>
        <p class="ev-dress__code">{{ data().code }}</p>
        @if (data().description) { <p class="ev-dress__desc">{{ data().description }}</p> }
        @if (palette().length) {
          <div class="ev-dress__palette">
            @for (c of palette(); track $index) {
              <div class="ev-dress__swatch">
                <span class="ev-dress__chip" [style.background]="c.color"></span>
                @if (c.label) { <span class="ev-dress__chip-label">{{ c.label }}</span> }
              </div>
            }
          </div>
        }
        @if (data().avoid) { <p class="ev-dress__avoid">🚫 {{ data().avoid }}</p> }
      </div>
    </section>
  `,
  styles: [`
    .ev-dress__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-4); }
    .ev-dress__code { font-family: var(--heading-font, inherit); font-size: var(--font-size-3xl);
      color: var(--p2); letter-spacing: .02em; }
    .ev-dress__desc { max-width: 560px; margin: var(--space-4) auto 0; }
    .ev-dress__palette { display: flex; gap: var(--space-4); justify-content: center;
      flex-wrap: wrap; margin-top: var(--space-8); }
    .ev-dress__swatch { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
    .ev-dress__chip { width: 52px; height: 52px; border-radius: 50%; display: block;
      box-shadow: var(--shadow-sm); border: 2px solid #fff; outline: 1px solid var(--color-border); }
    .ev-dress__chip-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .ev-dress__avoid { margin-top: var(--space-6); color: var(--color-text-secondary); font-weight: 600; }
  `],
})
export class DressCodeComponent {
  readonly data = input<DressCodeData>({ code: '' });
  readonly title = computed(() => this.data().title ?? 'Código de vestimenta');
  readonly palette = computed(() => this.data().palette ?? []);
}
