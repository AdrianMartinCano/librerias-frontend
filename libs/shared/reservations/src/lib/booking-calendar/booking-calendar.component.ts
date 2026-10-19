import {
  Component, ChangeDetectionStrategy, input, output, signal, computed,
} from '@angular/core';

interface CalendarDay {
  date:           string | null;  // null = día de otro mes
  day:            number;
  isCurrentMonth: boolean;
  isAvailable:    boolean;
  isPast:         boolean;
  isSelected:     boolean;
  isToday:        boolean;
  isBusy:         boolean;        // tiene reservas (modo readonly / marca de ocupado)
  selectable:     boolean;        // si se puede pulsar, según el modo
}

/** available = solo días con disponibilidad · all = cualquier día futuro (admin) · readonly = solo ver */
export type CalendarMode = 'available' | 'all' | 'readonly';

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

@Component({
  selector: 'lib-booking-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-cal">
      <!-- Header: mes + navegación -->
      <div class="lib-cal__header">
        <button type="button" class="lib-cal__nav" (click)="prevMonth()" aria-label="Mes anterior">‹</button>
        <span class="lib-cal__month">{{ monthLabel() }}</span>
        <button type="button" class="lib-cal__nav" (click)="nextMonth()" aria-label="Mes siguiente">›</button>
      </div>

      <!-- Días de la semana -->
      <div class="lib-cal__grid">
        @for (wd of weekDays; track wd) {
          <div class="lib-cal__wd">{{ wd }}</div>
        }

        <!-- Días -->
        @for (day of calendarDays(); track day.date ?? ('off-' + $index)) {
          <button
            type="button"
            class="lib-cal__day"
            [class.lib-cal__day--other]="!day.isCurrentMonth"
            [class.lib-cal__day--today]="day.isToday"
            [class.lib-cal__day--available]="day.isAvailable && mode() !== 'readonly'"
            [class.lib-cal__day--busy]="day.isBusy"
            [class.lib-cal__day--selected]="day.isSelected"
            [class.lib-cal__day--disabled]="!day.selectable"
            [disabled]="!day.selectable"
            (click)="selectDay(day)"
            [attr.aria-label]="day.date ? dayAria(day) : null"
            [attr.aria-pressed]="day.isSelected"
          >
            {{ day.day }}
          </button>
        }
      </div>

      <!-- Leyenda -->
      <div class="lib-cal__legend">
        @if (mode() === 'readonly') {
          <span class="lib-cal__legend-dot lib-cal__legend-dot--busy"></span> Ocupado
        } @else {
          <span class="lib-cal__legend-dot lib-cal__legend-dot--available"></span> Disponible
          <span class="lib-cal__legend-dot lib-cal__legend-dot--selected"></span> Seleccionado
        }
      </div>
    </div>
  `,
  styles: [`
    .lib-cal { width: 100%; user-select: none; }

    .lib-cal__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-3, .75rem);
    }

    .lib-cal__nav {
      width: 34px; height: 34px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 50%;
      background: var(--color-background, #fff);
      color: var(--color-text, #1a1a1a);
      font-size: 1.1rem; line-height: 1; cursor: pointer;
      transition: background var(--transition-fast, 120ms ease), color var(--transition-fast, 120ms ease), border-color var(--transition-fast, 120ms ease);
    }
    .lib-cal__nav:hover {
      background: var(--cal-nav-hover-bg, color-mix(in srgb, var(--color-accent, #ff4d4d) 10%, transparent));
      color: var(--color-accent, #ff4d4d);
      border-color: color-mix(in srgb, var(--color-accent, #ff4d4d) 40%, var(--color-border, #e0e0e0));
    }
    .lib-cal__nav:focus-visible { outline: 2px solid var(--color-accent, #ff4d4d); outline-offset: 2px; }

    .lib-cal__month {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #1a1a1a);
      text-transform: capitalize; letter-spacing: -.01em;
    }

    .lib-cal__grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-1, .35rem);
    }

    .lib-cal__wd {
      text-align: center; font-size: var(--font-size-xs, .7rem);
      font-weight: var(--font-weight-semibold, 600);
      text-transform: uppercase; letter-spacing: .06em;
      color: var(--color-text-muted, #909090);
      padding-bottom: var(--space-2, .5rem);
    }

    .lib-cal__day {
      min-height: 52px; padding: var(--space-2, .5rem) 0;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: var(--cal-day-radius, var(--radius-md, .5rem));
      font-size: var(--font-size-sm, .875rem); font-family: inherit;
      background: none; cursor: pointer; color: var(--color-text-muted, #909090);
      transition: background var(--transition-fast, 120ms ease), color var(--transition-fast, 120ms ease), box-shadow var(--transition-fast, 120ms ease);
    }

    .lib-cal__day--other    { opacity: .3; pointer-events: none; }
    .lib-cal__day:disabled  { cursor: not-allowed; }

    .lib-cal__day--available {
      color: var(--color-text, #1a1a1a);
      font-weight: var(--font-weight-medium, 500);
    }
    .lib-cal__day--available:hover {
      background: var(--cal-day-hover-bg, color-mix(in srgb, var(--color-accent, #ff4d4d) 12%, transparent));
      color: var(--cal-day-hover-fg, var(--color-accent, #ff4d4d));
    }
    .lib-cal__day:focus-visible { outline: 2px solid var(--color-accent, #ff4d4d); outline-offset: 2px; }

    .lib-cal__day--today {
      box-shadow: inset 0 0 0 1.5px var(--cal-today-ring, color-mix(in srgb, var(--color-accent, #ff4d4d) 45%, var(--color-border, #e0e0e0)));
      font-weight: var(--font-weight-semibold, 600);
    }

    .lib-cal__day--selected {
      background: var(--cal-selected-bg, var(--color-accent, #ff4d4d)) !important;
      color: var(--cal-selected-fg, #fff) !important;
      font-weight: var(--font-weight-bold, 700);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent, #ff4d4d) 35%, transparent) !important;
    }

    /* Día con reservas (modo readonly / marca de ocupado): celda con fondo de acento suave */
    .lib-cal__day--busy {
      background: var(--cal-busy-bg, color-mix(in srgb, var(--color-accent, #ff4d4d) 16%, transparent));
      color: var(--cal-busy-fg, var(--color-accent-hover, var(--color-accent, #ff4d4d)));
      font-weight: var(--font-weight-semibold, 600);
    }
    .lib-cal__day--busy:not(:disabled):hover {
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 26%, transparent);
    }

    .lib-cal__legend-dot--busy {
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 16%, transparent);
      border: 1px solid var(--color-accent, #ff4d4d);
      border-radius: 3px;
    }

    .lib-cal__legend {
      display: flex; align-items: center; gap: var(--space-4, 1rem);
      margin-top: var(--space-3, .75rem);
      font-size: var(--font-size-xs, .75rem);
      color: var(--color-text-muted, #909090);
    }

    .lib-cal__legend-dot {
      display: inline-block; width: 10px; height: 10px; border-radius: 50%;
    }
    .lib-cal__legend-dot--available { background: color-mix(in srgb, var(--color-accent, #ff4d4d) 25%, var(--color-surface, #f8f9fa)); border: 1px solid var(--color-accent, #ff4d4d); }
    .lib-cal__legend-dot--selected  { background: var(--color-accent, #ff4d4d); }
  `],
})
export class BookingCalendarComponent {
  readonly disponibilidad = input<string[]>([]);   // ['2025-06-10', '2025-06-11', ...]
  readonly selected       = input<string | null>(null);
  readonly fechaMinima    = input<string | null>(null);
  readonly fechaMaxima    = input<string | null>(null);
  /** available = solo días disponibles · all = cualquier día futuro (admin) · readonly = solo ver */
  readonly mode           = input<CalendarMode>('available');
  /** Días con reservas, para marcarlos como ocupados (sobre todo en modo readonly). */
  readonly busyDates      = input<string[]>([]);

  readonly diaSeleccionado = output<string>();

  readonly weekDays = WEEK_DAYS;

  private readonly today    = new Date();
  private readonly todayStr = this.toDateStr(this.today);

  readonly currentYear  = signal(this.today.getFullYear());
  readonly currentMonth = signal(this.today.getMonth());

  readonly monthLabel = computed(() =>
    `${MONTHS[this.currentMonth()]} ${this.currentYear()}`
  );

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const y = this.currentYear();
    const m = this.currentMonth();
    const firstDow    = (new Date(y, m, 1).getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev  = new Date(y, m, 0).getDate();
    const avail       = new Set(this.disponibilidad());
    const busy        = new Set(this.busyDates());
    const sel         = this.selected();
    const minDate     = this.fechaMinima() ?? this.todayStr;
    const maxDate     = this.fechaMaxima();
    const mode        = this.mode();

    const off: CalendarDay = { date: null, day: 0, isCurrentMonth: false, isAvailable: false, isPast: true, isSelected: false, isToday: false, isBusy: false, selectable: false };
    const days: CalendarDay[] = [];

    // Días del mes anterior
    for (let i = firstDow - 1; i >= 0; i--) {
      days.push({ ...off, day: daysInPrev - i });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr     = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isAvailable = avail.has(dateStr);
      const isPast      = dateStr < minDate;
      const tooLate     = maxDate ? dateStr > maxDate : false;
      // Selectividad según el modo:
      const selectable =
        mode === 'readonly' ? true :
        mode === 'all'      ? !isPast && !tooLate :
        /* available */       isAvailable && !isPast && !tooLate;
      days.push({
        date:           dateStr,
        day:            d,
        isCurrentMonth: true,
        isAvailable,
        isPast,
        isSelected:     dateStr === sel,
        isToday:        dateStr === this.todayStr,
        isBusy:         busy.has(dateStr),
        selectable,
      });
    }

    // Días del mes siguiente
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ ...off, day: d });
    }

    return days;
  });

  prevMonth(): void {
    if (this.currentMonth() === 0) { this.currentMonth.set(11); this.currentYear.update(y => y - 1); }
    else this.currentMonth.update(m => m - 1);
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) { this.currentMonth.set(0); this.currentYear.update(y => y + 1); }
    else this.currentMonth.update(m => m + 1);
  }

  selectDay(day: CalendarDay): void {
    if (day.date && day.selectable) {
      this.diaSeleccionado.emit(day.date);
    }
  }

  dayAria(day: CalendarDay): string | null {
    if (!day.date) return null;
    const base = this.formatLabel(day.date);
    return day.isBusy ? `${base} — ocupado` : base;
  }

  formatLabel(date: string): string {
    return new Date(date + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
