import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { FeaturesData } from '@org/models';

@Component({
  selector: 'lib-cms-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './features.component.css',
  template: `
    <section class="section section--surface">
      <div class="container">
        @if (data().title) {
          <div class="cms-features__header">
            <h2 class="cms-features__title">{{ data().title }}</h2>
            @if (data().subtitle) { <p class="cms-features__subtitle">{{ data().subtitle }}</p> }
          </div>
        }
        <div class="cms-features__grid" [class]="'cms-features__grid--' + (data().cols || 3)">
          @for (item of data().items; track item.title) {
            <div class="cms-features__item">
              <span class="cms-features__icon">{{ item.icon }}</span>
              <h3 class="cms-features__item-title">{{ item.title }}</h3>
              <p class="cms-features__item-text">{{ item.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class FeaturesComponent {
  readonly data = input.required<FeaturesData>();
}

