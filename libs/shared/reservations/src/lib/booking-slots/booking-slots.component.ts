import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { TimeSlot } from '@org/models';

@Component({
  selector: 'lib-booking-slots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-slots">
      @if (slots().length === 0) {
        <p class="lib-slots__empty">{{ emptyMessage() }}</p>
      } @else {
        <div class="lib-slots__grid">
          @for (slot of slots(); track slot.time) {
            <button
              type="button"
              class="lib-slots__btn"
              [class.lib-slots__btn--selected]="selected()?.time === slot.time"
              [class.lib-slots__btn--unavailable]="!slot.available"
              [disabled]="!slot.available"
              (click)="slotSeleccionado.emit(slot)"
              [attr.aria-pressed]="selected()?.time === slot.time"
              [attr.aria-label]="slot.label || slot.time"
            >
              {{ slot.label || slot.time }}
            </button>
          }
        </div>
        @if (selected()) {
          <p class="lib-slots__selection">
            Hora seleccionada: <strong>{{ selected()!.label || selected()!.time }}</strong>
          </p>
        }
      }
    </div>
  `,
  styles: [`
    .lib-slots__empty {
      text-align: center; padding: var(--space-8, 2rem);
      color: var(--color-text-muted, #909090);
      font-size: var(--font-size-sm, .875rem);
    }

    .lib-slots__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: var(--space-2, .5rem);
    }

    .lib-slots__btn {
      padding: var(--space-3, .75rem) var(--space-2, .5rem);
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-md, .5rem);
      background: var(--color-background, #fff);
      color: var(--color-text, #1a1a1a);
      font-size: var(--font-size-sm, .875rem);
      font-weight: var(--font-weight-medium, 500);
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      transition: border-color var(--transition-fast, 120ms ease),
                  background var(--transition-fast, 120ms ease),
                  color var(--transition-fast, 120ms ease);
    }

    .lib-slots__btn:hover:not(:disabled) {
      border-color: var(--color-accent, #ff4d4d);
      color: var(--color-accent, #ff4d4d);
    }

    .lib-slots__btn--selected {
      background: var(--color-accent, #ff4d4d) !important;
      border-color: var(--color-accent, #ff4d4d) !important;
      color: #fff !important;
      font-weight: var(--font-weight-bold, 700);
    }

    .lib-slots__btn--unavailable {
      opacity: .35; cursor: not-allowed; text-decoration: line-through;
    }

    .lib-slots__selection {
      margin-top: var(--space-3, .75rem);
      font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-secondary, #595959);
    }
  `],
})
export class BookingSlotsComponent {
  readonly slots        = input.required<TimeSlot[]>();
  readonly selected     = input<TimeSlot | null>(null);
  readonly emptyMessage = input('No hay horas disponibles para este día.');

  readonly slotSeleccionado = output<TimeSlot>();
}
