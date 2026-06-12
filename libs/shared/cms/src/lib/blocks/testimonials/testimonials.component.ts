import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, signal, computed } from '@angular/core';
import { TestimonialsData } from '@org/models';

@Component({
  selector: 'lib-cms-testimonials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './testimonials.component.css',
  template: `
    <section class="section">
      <div class="container">
        @if (data().title) { <h2 class="cms-test__title">{{ data().title }}</h2> }
        <div class="cms-test__grid">
          @for (item of data().items; track item.author) {
            <div class="cms-test__card">
              @if (item.rating) {
                <div class="cms-test__stars">{{ '★'.repeat(item.rating) }}{{ '☆'.repeat(5 - item.rating) }}</div>
              }
              <blockquote class="cms-test__text">"{{ item.text }}"</blockquote>
              <div class="cms-test__author">
                @if (item.avatar) {
                  <img [src]="item.avatar" [alt]="item.author" class="cms-test__avatar" />
                } @else {
                  <div class="cms-test__avatar-placeholder">{{ item.author[0] }}</div>
                }
                <div>
                  <p class="cms-test__name">{{ item.author }}</p>
                  @if (item.role) { <p class="cms-test__role">{{ item.role }}</p> }
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class TestimonialsComponent {
  readonly data = input.required<TestimonialsData>();
}

