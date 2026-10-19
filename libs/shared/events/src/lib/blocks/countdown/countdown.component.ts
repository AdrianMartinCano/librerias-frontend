import {
  Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, signal,
  afterNextRender, DestroyRef, inject,
} from '@angular/core';
import { CountdownData } from '@org/models';
import { EventContext } from '../../event-context';
import { countdownTo } from '../../reveal.util';

@Component({
  selector: 'lib-event-countdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-countdown">
      <div class="container text-center">
        @if (title()) { <h2 class="ev-countdown__title">{{ title() }}</h2> }
        @if (parts().finished) {
          <p class="ev-countdown__done">{{ data().finishedText ?? '¡Es hoy! 🎉' }}</p>
        } @else {
          <div class="ev-countdown__grid">
            <div class="ev-countdown__unit"><span class="ev-countdown__num">{{ parts().days }}</span><span class="ev-countdown__label">días</span></div>
            <div class="ev-countdown__unit"><span class="ev-countdown__num">{{ pad(parts().hours) }}</span><span class="ev-countdown__label">horas</span></div>
            <div class="ev-countdown__unit"><span class="ev-countdown__num">{{ pad(parts().minutes) }}</span><span class="ev-countdown__label">min</span></div>
            <div class="ev-countdown__unit"><span class="ev-countdown__num">{{ pad(parts().seconds) }}</span><span class="ev-countdown__label">seg</span></div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .ev-countdown { background: var(--p4); }
    .ev-countdown__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-8); }
    .ev-countdown__grid { display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap; }
    .ev-countdown__unit { display: flex; flex-direction: column; align-items: center;
      min-width: 84px; padding: var(--space-4) var(--space-3); border-radius: var(--radius-lg);
      background: var(--color-background); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); }
    .ev-countdown__num { font-family: var(--heading-font, inherit); font-size: clamp(2rem, 6vw, 3.2rem);
      font-weight: 700; color: var(--p2); line-height: 1; font-variant-numeric: tabular-nums; }
    .ev-countdown__label { margin-top: var(--space-2); font-size: var(--font-size-sm);
      text-transform: uppercase; letter-spacing: .12em; color: var(--color-text-secondary); }
    .ev-countdown__done { font-family: var(--heading-font, inherit); font-size: var(--font-size-2xl); color: var(--p2); }
  `],
})
export class CountdownComponent {
  readonly data = input<CountdownData>({});
  readonly ctx = input.required<EventContext>();

  private readonly now = signal(new Date());
  private readonly destroyRef = inject(DestroyRef);
  readonly title = computed(() => this.data().title ?? 'Cuenta atrás');
  readonly target = computed(() => this.data().target ?? this.ctx().date);
  readonly parts = computed(() => countdownTo(this.target(), this.now()));

  constructor() {
    // El timer solo corre en navegador (no en SSR/tests) para evitar fugas.
    afterNextRender(() => {
      const id = setInterval(() => this.now.set(new Date()), 1000);
      this.destroyRef.onDestroy(() => clearInterval(id));
    });
  }

  pad(n: number): string { return n.toString().padStart(2, '0'); }
}
