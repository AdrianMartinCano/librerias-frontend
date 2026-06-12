import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaBannerData } from '@org/models';

@Component({
  selector: 'lib-cms-cta-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './cta-banner.component.css',
  template: `
    <section class="cms-cta" [class]="'cms-cta--' + (data().background || 'accent')">
      <div class="container cms-cta__inner">
        <div>
          <h2 class="cms-cta__title">{{ data().title }}</h2>
          @if (data().subtitle) { <p class="cms-cta__subtitle">{{ data().subtitle }}</p> }
        </div>
        <div class="cms-cta__actions">
          @if (data().cta.external) {
            <a class="cms-cta__btn cms-cta__btn--primary" [href]="data().cta.href" target="_blank" rel="noopener">{{ data().cta.label }}</a>
          } @else {
            <a class="cms-cta__btn cms-cta__btn--primary" [routerLink]="data().cta.href">{{ data().cta.label }}</a>
          }
          @if (data().ctaSecondary) {
            @if (data().ctaSecondary!.external) {
              <a class="cms-cta__btn cms-cta__btn--secondary" [href]="data().ctaSecondary!.href" target="_blank" rel="noopener">{{ data().ctaSecondary!.label }}</a>
            } @else {
              <a class="cms-cta__btn cms-cta__btn--secondary" [routerLink]="data().ctaSecondary!.href">{{ data().ctaSecondary!.label }}</a>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class CtaBannerComponent {
  readonly data = input.required<CtaBannerData>();
}

