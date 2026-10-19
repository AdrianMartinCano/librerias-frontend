import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { BusySlot } from '@org/models';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';

/**
 * Calendario público de SOLO LECTURA. Muestra la ocupación (franjas ocupadas) sin ningún dato
 * del cliente. El visitante solo ve cuándo está libre u ocupado; no puede reservar desde aquí.
 */
@Component({
  selector: 'lib-public-calendar',
  standalone: true,
  imports: [BookingCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-pubcal">
      @if (title()) { <h2 class="lib-pubcal__title">{{ title() }}</h2> }

      <lib-booking-calendar
        mode="readonly"
        [busyDates]="busyDates()"
        [selected]="selectedDate()"
        (diaSeleccionado)="selectedDate.set($event)"
      />

      @if (selectedDate()) {
        <div class="lib-pubcal__day" aria-live="polite">
          <h3 class="lib-pubcal__day-title">{{ dayTitle() }}</h3>
          @if (daySlots().length === 0) {
            <p class="lib-pubcal__free">Sin reservas — disponible todo el día.</p>
          } @else {
            <ul class="lib-pubcal__slots">
              @for (s of daySlots(); track s.start) {
                <li class="lib-pubcal__slot">
                  <span class="lib-pubcal__slot-dot" aria-hidden="true"></span>
                  {{ s.label || 'Ocupado' }} · {{ s.start }}–{{ s.end }}
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .lib-pubcal__title { font-size: var(--font-size-xl, 1.25rem); font-weight: var(--font-weight-bold, 700); margin-bottom: var(--space-4, 1rem); }
    .lib-pubcal__day { margin-top: var(--space-4, 1rem); padding-top: var(--space-4, 1rem); border-top: 1px solid var(--color-border, #e0e0e0); }
    .lib-pubcal__day-title { font-size: var(--font-size-base, 1rem); font-weight: var(--font-weight-semibold, 600); text-transform: capitalize; margin-bottom: var(--space-3, .75rem); }
    .lib-pubcal__free { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .lib-pubcal__slots { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-pubcal__slot { display: flex; align-items: center; gap: var(--space-2, .5rem); font-size: var(--font-size-sm, .875rem); color: var(--color-text, #1a1a1a); }
    .lib-pubcal__slot-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent, #ff4d4d); flex-shrink: 0; }
  `],
})
export class PublicCalendarComponent {
  /** Franjas ocupadas (sin datos del cliente). */
  readonly busy  = input<BusySlot[]>([]);
  readonly title = input('');

  readonly selectedDate = signal<string | null>(null);

  readonly busyDates = computed(() => [...new Set(this.busy().map((b) => b.date))]);

  readonly daySlots = computed<BusySlot[]>(() => {
    const d = this.selectedDate();
    if (!d) return [];
    return this.busy()
      .filter((b) => b.date === d)
      .sort((a, b) => a.start.localeCompare(b.start));
  });

  readonly dayTitle = computed(() => {
    const d = this.selectedDate();
    return d
      ? new Date(d + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
  });
}
