import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, signal } from '@angular/core';
import { FaqData } from '@org/models';

@Component({
  selector: 'lib-cms-faq',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './faq.component.css',
  template: `
    <section class="section section--surface">
      <div class="container cms-faq__inner">
        @if (data().title) { <h2 class="cms-faq__title">{{ data().title }}</h2> }
        <div class="cms-faq__list">
          @for (item of data().items; track item.question; let i = $index) {
            <div class="cms-faq__item" [class.cms-faq__item--open]="open() === i">
              <button
                type="button"
                class="cms-faq__question"
                (click)="toggle(i)"
                [attr.aria-expanded]="open() === i"
              >
                {{ item.question }}
                <svg class="cms-faq__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              @if (open() === i) {
                <div class="cms-faq__answer">{{ item.answer }}</div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class FaqComponent {
  readonly data = input.required<FaqData>();
  readonly open = signal<number | null>(null);

  toggle(i: number): void {
    this.open.update((v) => (v === i ? null : i));
  }
}

