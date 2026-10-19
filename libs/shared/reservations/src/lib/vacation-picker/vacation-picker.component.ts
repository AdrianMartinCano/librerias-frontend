import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';

/**
 * Selector de varias fechas (vacaciones / días cerrados) sobre el calendario themeable de la librería,
 * en vez de inputs `type="date"` nativos. Componente <b>controlado</b>: recibe {@code dates} (ISO
 * 'YYYY-MM-DD') y emite {@code datesChange} con la nueva lista.
 *
 * <ul>
 *   <li><b>Día suelto:</b> pulsar un día lo añade o lo quita (toggle).</li>
 *   <li><b>Rango:</b> pulsar el día inicial y luego el final añade todo el tramo de una vez.</li>
 *   <li><b>Limpiar todo:</b> vacía la selección (evita borrar día por día).</li>
 * </ul>
 */
@Component({
  selector: 'lib-vacation-picker',
  standalone: true,
  imports: [BookingCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-vac">
      <div class="lib-vac__bar">
        <div class="lib-vac__modes" role="group" aria-label="Modo de selección">
          <button type="button" class="lib-vac__mode" [class.lib-vac__mode--on]="mode() === 'day'"
                  (click)="setMode('day')">Día suelto</button>
          <button type="button" class="lib-vac__mode" [class.lib-vac__mode--on]="mode() === 'range'"
                  (click)="setMode('range')">Rango</button>
        </div>
        @if (dates().length) {
          <button type="button" class="lib-vac__clear" (click)="clearAll()">
            Limpiar todo ({{ dates().length }})
          </button>
        }
      </div>

      <p class="lib-vac__hint">
        @if (mode() === 'range' && pending()) { Inicio: <strong>{{ pending() }}</strong> — elige el día final. }
        @else if (mode() === 'range') { Pulsa el día inicial y luego el final. }
        @else { Pulsa un día para añadirlo o quitarlo. }
      </p>

      <lib-booking-calendar
        mode="all"
        [busyDates]="dates()"
        [selected]="pending()"
        (diaSeleccionado)="onDay($event)"
      />

      @if (dates().length) {
        <div class="lib-vac__chips">
          @for (d of dates(); track d) {
            <span class="lib-vac__chip">{{ d }}<button type="button" class="lib-vac__x"
                  (click)="remove(d)" [attr.aria-label]="'Quitar ' + d">×</button></span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .lib-vac { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-vac__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3, .75rem); flex-wrap: wrap; }
    .lib-vac__modes { display: inline-flex; border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); overflow: hidden; }
    .lib-vac__mode {
      padding: .35rem .8rem; border: none; background: var(--color-background, #fff);
      font-family: inherit; font-size: var(--font-size-sm, .875rem); cursor: pointer; color: var(--color-text, #1a1a1a);
    }
    .lib-vac__mode + .lib-vac__mode { border-left: 1px solid var(--color-border, #e2e2e2); }
    .lib-vac__mode--on { background: var(--color-accent, #ff4d4d); color: #fff; font-weight: var(--font-weight-semibold, 600); }
    .lib-vac__clear {
      padding: .35rem .8rem; border: 1px solid color-mix(in srgb, var(--color-danger, #dc3545) 45%, transparent);
      background: transparent; color: var(--color-danger, #dc3545); border-radius: var(--radius-md, .5rem);
      font-family: inherit; font-size: var(--font-size-sm, .875rem); cursor: pointer;
    }
    .lib-vac__clear:hover { background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, transparent); }
    .lib-vac__hint { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); margin: 0; }
    .lib-vac__chips { display: flex; flex-wrap: wrap; gap: var(--space-2, .5rem); }
    .lib-vac__chip {
      display: inline-flex; align-items: center; gap: .3rem; font-variant-numeric: tabular-nums;
      padding: .3rem .6rem; border: 1px solid var(--color-border, #e2e2e2); border-radius: 999px; font-size: var(--font-size-sm, .875rem);
    }
    .lib-vac__x { border: none; background: none; cursor: pointer; font-size: 1.1rem; line-height: 1; color: var(--color-text-muted, #909090); padding: 0 .1rem; }
    .lib-vac__x:hover { color: var(--color-danger, #dc3545); }
  `],
})
export class VacationPickerComponent {
  /** Fechas seleccionadas en ISO 'YYYY-MM-DD'. */
  readonly dates = input<string[]>([]);
  readonly datesChange = output<string[]>();

  readonly mode    = signal<'day' | 'range'>('day');
  readonly pending = signal<string | null>(null);

  setMode(m: 'day' | 'range'): void {
    this.mode.set(m);
    this.pending.set(null);
  }

  onDay(date: string): void {
    if (this.mode() === 'day') { this.toggle(date); return; }
    // Modo rango: primer clic = inicio; segundo = fin → añade el tramo completo.
    const start = this.pending();
    if (!start) { this.pending.set(date); return; }
    this.addRange(start, date);
    this.pending.set(null);
  }

  private toggle(date: string): void {
    const set = new Set(this.dates());
    if (set.has(date)) set.delete(date); else set.add(date);
    this.emit(set);
  }

  private addRange(a: string, b: string): void {
    const from = a <= b ? a : b;
    const to   = a <= b ? b : a;
    const set = new Set(this.dates());
    let cur = from; let guard = 0;
    while (cur <= to && guard++ < 730) { set.add(cur); cur = this.nextDay(cur); }
    this.emit(set);
  }

  remove(date: string): void {
    const set = new Set(this.dates());
    set.delete(date);
    this.emit(set);
  }

  clearAll(): void {
    this.pending.set(null);
    this.datesChange.emit([]);
  }

  private emit(set: Set<string>): void {
    this.datesChange.emit([...set].sort());
  }

  private nextDay(iso: string): string {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}
