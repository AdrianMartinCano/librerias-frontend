import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroData } from '@org/models';

@Component({
  selector: 'lib-cms-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './hero.component.css',
  template: `
    <section
      class="cms-hero"
      [class.cms-hero--center]="data().align === 'center'"
      [class.cms-hero--overlay]="data().overlay && data().image"
      [style.background-image]="data().image ? 'url(' + data().image + ')' : null"
      [style.min-height]="data().minHeight || null"
    >
      @if (data().overlay && data().image) {
        <div class="cms-hero__overlay"></div>
      }
      <div class="cms-hero__content container">
        <h1 class="cms-hero__title">{{ data().title }}</h1>
        @if (data().subtitle) {
          <p class="cms-hero__subtitle">{{ data().subtitle }}</p>
        }
        @if (data().cta || data().ctaSecondary) {
          <div class="cms-hero__actions">
            @if (data().cta) {
              @if (data().cta!.external) {
                <a class="cms-hero__btn cms-hero__btn--{{ data().cta!.variant || 'accent' }}" [href]="data().cta!.href" target="_blank" rel="noopener">{{ data().cta!.label }}</a>
              } @else {
                <a class="cms-hero__btn cms-hero__btn--{{ data().cta!.variant || 'accent' }}" [routerLink]="data().cta!.href">{{ data().cta!.label }}</a>
              }
            }
            @if (data().ctaSecondary) {
              @if (data().ctaSecondary!.external) {
                <a class="cms-hero__btn cms-hero__btn--{{ data().ctaSecondary!.variant || 'outline' }}" [href]="data().ctaSecondary!.href" target="_blank" rel="noopener">{{ data().ctaSecondary!.label }}</a>
              } @else {
                <a class="cms-hero__btn cms-hero__btn--{{ data().ctaSecondary!.variant || 'outline' }}" [routerLink]="data().ctaSecondary!.href">{{ data().ctaSecondary!.label }}</a>
              }
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly data = input.required<HeroData>();
}

