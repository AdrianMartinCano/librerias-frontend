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
}

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
            [class.lib-cal__day--available]="day.isAvailable"
            [class.lib-cal__day--selected]="day.isSelected"
            [class.lib-cal__day--disabled]="!day.isAvailable || day.isPast || !day.isCurrentMonth"
            [disabled]="!day.isAvailable || day.isPast || !day.isCurrentMonth"
            (click)="selectDay(day)"
            [attr.aria-label]="day.date ? formatLabel(day.date) : null"
            [attr.aria-pressed]="day.isSelected"
          >
            {{ day.day }}
          </button>
        }
      </div>

      <!-- Leyenda -->
      <div class="lib-cal__legend">
        <span class="lib-cal__legend-dot lib-cal__legend-dot--available"></span> Disponible
        <span class="lib-cal__legend-dot lib-cal__legend-dot--selected"></span> Seleccionado
      </div>
    </div>
  `,
  styles: [`
    .lib-cal { width: 100%; user-select: none; }

    .lib-cal__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-4, 1rem);
    }

    .lib-cal__nav {
      width: 36px; height: 36px;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-md, .5rem);
      background: var(--color-background, #fff);
      color: var(--color-text, #1a1a1a);
      font-size: 1.25rem; cursor: pointer;
      transition: background var(--transition-fast, 120ms ease);
    }
    .lib-cal__nav:hover { background: var(--color-surface, #f8f9fa); }

    .lib-cal__month {
      font-size: var(--font-size-base, 1rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1a1a1a);
    }

    .lib-cal__grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
    }

    .lib-cal__wd {
      text-align: center; font-size: var(--font-size-xs, .75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-muted, #909090);
      padding: var(--space-2, .5rem) 0;
    }

    .lib-cal__day {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      border: none; border-radius: var(--radius-md, .5rem);
      font-size: var(--font-size-sm, .875rem); font-family: inherit;
      background: none; cursor: pointer;
      transition: background var(--transition-fast, 120ms ease), color var(--transition-fast, 120ms ease);
      color: var(--color-text-muted, #909090);
    }

    .lib-cal__day--other    { opacity: .25; pointer-events: none; }
    .lib-cal__day:disabled  { cursor: not-allowed; }

    .lib-cal__day--available {
      color: var(--color-text, #1a1a1a);
      font-weight: var(--font-weight-medium, 500);
    }
    .lib-cal__day--available:hover {
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 12%, transparent);
      color: var(--color-accent, #ff4d4d);
    }

    .lib-cal__day--today {
      border: 1.5px solid var(--color-border, #e0e0e0);
    }

    .lib-cal__day--selected {
      background: var(--color-accent, #ff4d4d) !important;
      color: #fff !important;
      font-weight: var(--font-weight-bold, 700);
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
    const sel         = this.selected();
    const minDate     = this.fechaMinima() ?? this.todayStr;

    const days: CalendarDay[] = [];

    // Días del mes anterior
    for (let i = firstDow - 1; i >= 0; i--) {
      days.push({ date: null, day: daysInPrev - i, isCurrentMonth: false, isAvailable: false, isPast: true, isSelected: false, isToday: false });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date:           dateStr,
        day:            d,
        isCurrentMonth: true,
        isAvailable:    avail.has(dateStr),
        isPast:         dateStr < minDate,
        isSelected:     dateStr === sel,
        isToday:        dateStr === this.todayStr,
      });
    }

    // Días del mes siguiente
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: null, day: d, isCurrentMonth: false, isAvailable: false, isPast: true, isSelected: false, isToday: false });
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
    if (day.date && day.isAvailable && !day.isPast) {
      this.diaSeleccionado.emit(day.date);
    }
  }

  formatLabel(date: string): string {
    return new Date(date + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
