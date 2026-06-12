import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { TrustBadgesData } from '@org/models';

@Component({
  selector: 'lib-cms-trust-badges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './trust-badges.component.css',
  template: `
    <section class="section cms-trust-badges" [class.cms-trust-badges--center]="data().align === 'center'">
      <div class="container">
        @if (data().title) { <h2 class="cms-trust-badges__title">{{ data().title }}</h2> }
        <ul class="cms-trust-badges__list">
          @for (badge of data().items; track badge.text) {
            <li class="cms-trust-badges__item">
              <span class="cms-trust-badges__icon" aria-hidden="true">{{ badge.icon }}</span>
              <span class="cms-trust-badges__text">{{ badge.text }}</span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class TrustBadgesComponent {
  readonly data = input.required<TrustBadgesData>();
}
