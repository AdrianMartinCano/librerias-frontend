import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, signal } from '@angular/core';
import { GiftRegistryData } from '@org/models';

@Component({
  selector: 'lib-event-gift-registry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-gift" [class.section--surface]="true">
      <div class="container text-center">
        <h2 class="ev-gift__title">{{ title() }}</h2>
        @if (data().message) { <p class="ev-gift__msg">{{ data().message }}</p> }
        <div class="ev-gift__grid">
          @for (opt of options(); track $index) {
            <div class="ev-gift__card">
              @if (opt.icon) { <span class="ev-gift__icon">{{ opt.icon }}</span> }
              <p class="ev-gift__label">{{ opt.label }}</p>
              @if (opt.isLink) {
                <a class="ev-gift__value ev-gift__value--link" [href]="opt.value" target="_blank" rel="noopener">Abrir ↗</a>
              } @else {
                <button type="button" class="ev-gift__value" (click)="copy(opt.value)">{{ opt.value }}</button>
                @if (copied() === opt.value) { <span class="ev-gift__copied">¡Copiado!</span> }
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ev-gift__title { font-family: var(--heading-font, inherit); }
    .ev-gift__msg { max-width: 620px; margin: var(--space-4) auto 0; }
    .ev-gift__grid { display: grid; gap: var(--space-6); margin-top: var(--space-10);
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .ev-gift__card { padding: var(--space-6); background: var(--color-background);
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
    .ev-gift__icon { font-size: 2rem; }
    .ev-gift__label { font-weight: 600; margin: var(--space-2) 0; color: var(--color-text); }
    .ev-gift__value { display: inline-block; font-family: var(--font-mono, monospace); font-size: var(--font-size-lg);
      color: var(--p2); background: none; border: 0; cursor: pointer; word-break: break-all; }
    .ev-gift__value--link { text-decoration: none; }
    .ev-gift__copied { display: block; font-size: var(--font-size-xs); color: var(--color-success); margin-top: var(--space-1); }
  `],
})
export class GiftRegistryComponent {
  readonly data = input<GiftRegistryData>({ options: [] });
  readonly copied = signal<string | null>(null);

  readonly title = computed(() => this.data().title ?? 'Regalos');
  readonly options = computed(() => this.data().options ?? []);

  copy(value: string): void {
    navigator.clipboard?.writeText(value).then(() => {
      this.copied.set(value);
      setTimeout(() => this.copied.set(null), 2000);
    });
  }
}
