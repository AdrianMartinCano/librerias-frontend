import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, signal, computed, ElementRef, inject, afterNextRender } from '@angular/core';
import { CountersData } from '@org/models';

@Component({
  selector: 'lib-cms-counters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './counters.component.css',
  template: `
    <section class="section section--surface">
      <div class="container">
        @if (data().title) { <h2 class="cms-counters__title">{{ data().title }}</h2> }
        <div class="cms-counters__grid" [class]="'cms-counters__grid--' + (data().cols || 3)">
          @for (item of data().items; track item.label; let i = $index) {
            <div class="cms-counters__item">
              <div class="cms-counters__value">
                @if (item.prefix) { <span class="cms-counters__affix">{{ item.prefix }}</span> }
                <span class="cms-counters__number">{{ displayed()[i] }}</span>
                @if (item.suffix) { <span class="cms-counters__affix">{{ item.suffix }}</span> }
              </div>
              <div class="cms-counters__label">{{ item.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class CountersComponent {
  readonly data = input.required<CountersData>();

  private readonly counts = signal<number[]>([]);
  readonly displayed = computed(() => {
    const c = this.counts();
    return c.length ? c : this.data().items.map(() => 0);
  });

  private readonly el = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.counts.set(this.data().items.map(() => 0));
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.animate();
          observer.disconnect();
        }
      }, { threshold: 0.3 });
      observer.observe(this.el.nativeElement);
    });
  }

  private animate(): void {
    const targets = this.data().items.map(i => i.value);
    const steps   = 40;
    const delay   = 1500 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      this.counts.set(targets.map(t => Math.round(t * ease)));
      if (step >= steps) clearInterval(timer);
    }, delay);
  }
}
