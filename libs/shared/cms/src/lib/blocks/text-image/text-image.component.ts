import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TextImageData } from '@org/models';

@Component({
  selector: 'lib-cms-text-image',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './text-image.component.css',
  template: `
    <section class="cms-ti section" [class.cms-ti--reverse]="data().imagePosition === 'left'">
      <div class="cms-ti__container container">
        <div class="cms-ti__text">
          @if (data().title) { <h2 class="cms-ti__title">{{ data().title }}</h2> }
          <p class="cms-ti__body">{{ data().text }}</p>
          @if (data().cta) {
            @if (data().cta!.external) {
              <a class="cms-ti__btn" [href]="data().cta!.href" target="_blank" rel="noopener">{{ data().cta!.label }}</a>
            } @else {
              <a class="cms-ti__btn" [routerLink]="data().cta!.href">{{ data().cta!.label }}</a>
            }
          }
        </div>
        <div class="cms-ti__image">
          <img [src]="data().image" [alt]="data().imageAlt || data().title || ''" class="cms-ti__img" loading="lazy" />
        </div>
      </div>
    </section>
  `,
})
export class TextImageComponent {
  readonly data = input.required<TextImageData>();
}

