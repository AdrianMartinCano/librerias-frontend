import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { BookingRequest, Staff } from '@org/models';

interface TimelineEvent {
  booking: BookingRequest;
  top:     number;   // px desde el inicio del día
  height:  number;   // px (duración)
  start:   string;
  end:     string;
}
interface TimelineColumn { staff: Staff; events: TimelineEvent[]; }

/**
 * Vista de día con una columna por trabajador (estilo "recurso" de Google Calendar). El jefe ve todas
 * las agendas a la vez; con un solo trabajador (o ROLE_STAFF) degenera a una única columna.
 *
 * <p>Componente de presentación: el padre pasa las reservas <b>del día</b> y reacciona a los eventos
 * {@code slotClicked} (alta en un hueco) y {@code bookingClicked} (abrir/editar una cita).</p>
 */
@Component({
  selector: 'lib-staff-day-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (staff().length === 0) {
      <p class="lib-tl__empty">No hay profesionales que mostrar.</p>
    } @else {
      @if (showNav()) {
        <div class="lib-tl__nav">
          <button type="button" class="lib-tl__nav-btn" (click)="shiftDay(-1)" aria-label="Día anterior">‹</button>
          <span class="lib-tl__nav-label">
            {{ dateLabel() }}
            @if (readonly()) { <span class="lib-tl__nav-ro">· solo lectura</span> }
          </span>
          <button type="button" class="lib-tl__nav-btn" (click)="shiftDay(1)" aria-label="Día siguiente">›</button>
        </div>
      }
      <div class="lib-tl" [style.--lib-tl-cols]="staff().length">
        <!-- Cabecera: nombres de columna -->
        <div class="lib-tl__corner"></div>
        @for (col of columns(); track col.staff.id) {
          <div class="lib-tl__head">
            <span class="lib-tl__dot" [style.background]="col.staff.color || 'var(--color-accent)'"></span>
            <span class="lib-tl__name">{{ col.staff.name }}</span>
          </div>
        }

        <!-- Eje de horas -->
        <div class="lib-tl__hours" [style.height.px]="bodyHeight()">
          @for (h of hours(); track h) {
            <div class="lib-tl__hour" [style.height.px]="hourHeight()">{{ label(h) }}</div>
          }
        </div>

        <!-- Columnas de cada trabajador -->
        @for (col of columns(); track col.staff.id) {
          <div class="lib-tl__col" [class.lib-tl__col--ro]="readonly()" [style.height.px]="bodyHeight()"
            role="button" tabindex="0"
            [attr.aria-label]="'Añadir cita con ' + col.staff.name"
            (click)="onColumnClick(col.staff, $event)"
            (keydown.enter)="onColumnKey(col.staff)"
            (keydown.space)="$event.preventDefault(); onColumnKey(col.staff)">
            @for (h of hours(); track h) {
              <div class="lib-tl__line" [style.height.px]="hourHeight()"></div>
            }
            @for (ev of col.events; track $index) {
              <button type="button" class="lib-tl__event"
                [style.top.px]="ev.top" [style.height.px]="ev.height"
                [style.borderLeftColor]="col.staff.color || 'var(--color-accent)'"
                [attr.title]="ev.start + '–' + ev.end + ' · ' + ev.booking.serviceName + ' · ' + ev.booking.clientName + ' (doble clic para abrir)'"
                (click)="$event.stopPropagation(); bookingClicked.emit(ev.booking)"
                (dblclick)="$event.stopPropagation(); bookingOpened.emit(ev.booking)">
                <span class="lib-tl__event-head">
                  <span class="lib-tl__event-time">{{ ev.start }}</span>
                  <span class="lib-tl__event-title">{{ ev.booking.serviceName }}</span>
                </span>
                <span class="lib-tl__event-client">{{ ev.booking.clientName }}</span>
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .lib-tl {
      display: grid;
      grid-template-columns: 56px repeat(var(--lib-tl-cols), minmax(120px, 1fr));
      column-gap: 1px; overflow-x: auto;
      background: var(--color-border, #e2e2e2);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
    }
    .lib-tl__corner, .lib-tl__head {
      background: var(--color-surface, #f8f9fa); padding: var(--space-2, .5rem);
      position: sticky; top: 0; z-index: 2;
    }
    .lib-tl__head { display: flex; align-items: center; gap: var(--space-2, .5rem); font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); }
    .lib-tl__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .lib-tl__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .lib-tl__hours { background: var(--color-surface, #f8f9fa); }
    .lib-tl__hour {
      box-sizing: border-box; padding: 2px var(--space-2, .5rem); text-align: right;
      font-size: var(--font-size-xs, .7rem); color: var(--color-text-muted, #909090);
      border-top: 1px solid var(--color-border, #e2e2e2);
    }

    .lib-tl__col { position: relative; background: var(--color-background, #fff); cursor: copy; }
    .lib-tl__col--ro { cursor: default; }
    .lib-tl__line { box-sizing: border-box; border-top: 1px solid var(--color-border, #eee); }

    /* Navegación de día */
    .lib-tl__nav {
      display: flex; align-items: center; justify-content: center; gap: var(--space-3, .75rem);
      margin-bottom: var(--space-3, .75rem);
    }
    .lib-tl__nav-btn {
      width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--color-border, #e0e0e0); border-radius: 50%;
      background: var(--color-background, #fff); color: var(--color-text, #1a1a1a);
      font-size: 1.1rem; line-height: 1; cursor: pointer;
    }
    .lib-tl__nav-btn:hover { background: var(--color-surface, #f8f9fa); color: var(--color-accent, #ff4d4d); }
    .lib-tl__nav-label { font-size: var(--font-size-base, 1rem); font-weight: var(--font-weight-semibold, 600); text-transform: capitalize; min-width: 220px; text-align: center; }
    .lib-tl__nav-ro { color: var(--color-text-muted, #909090); font-weight: var(--font-weight-normal, 400); font-size: var(--font-size-sm, .875rem); text-transform: none; }

    .lib-tl__event {
      position: absolute; left: 3px; right: 3px; overflow: hidden; text-align: left;
      display: flex; flex-direction: column; gap: 0; line-height: 1.15;
      padding: 2px 6px; cursor: pointer; font-family: inherit;
      background: var(--color-surface, #f1f3f5);
      border: 1px solid var(--color-border, #e2e2e2);
      border-left: 3px solid var(--color-accent, #ff4d4d);
      border-radius: var(--radius-sm, .35rem);
    }
    .lib-tl__event:hover { filter: brightness(.97); }
    /* Hora + servicio en una sola línea (legible aun en citas cortas); cliente debajo si cabe. */
    .lib-tl__event-head {
      display: flex; align-items: baseline; gap: 4px; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .lib-tl__event-time   { font-size: var(--font-size-xs, .72rem); font-weight: 700; color: var(--color-text, #1a1a1a); font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .lib-tl__event-title  { font-size: var(--font-size-xs, .72rem); overflow: hidden; text-overflow: ellipsis; }
    .lib-tl__event-client { font-size: var(--font-size-xs, .68rem); color: var(--color-text-muted, #909090); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .lib-tl__empty { text-align: center; padding: var(--space-8, 2rem); color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
  `],
})
export class StaffDayTimelineComponent {
  readonly staff      = input<Staff[]>([]);
  /** Reservas (se filtran a las de `date` si se indica). */
  readonly bookings   = input<BookingRequest[]>([]);
  readonly date       = input<string>('');
  readonly dayStart   = input(8);    // hora de inicio del eje
  readonly dayEnd     = input(21);   // hora de fin del eje
  readonly hourHeight = input(56);   // px por hora
  /** Minutos de redondeo al pulsar un hueco vacío. */
  readonly snapMinutes = input(15);
  /** Muestra la cabecera con flechas de día anterior/siguiente. */
  readonly showNav    = input(true);
  /** Día pasado: deshabilita crear citas (el detalle se abre en solo lectura desde el host). */
  readonly readonly   = input(false);

  readonly slotClicked    = output<{ staffId: string; time: string }>();
  /** Clic simple sobre una cita (selección rápida). */
  readonly bookingClicked = output<BookingRequest>();
  /** Doble clic sobre una cita: abrir su detalle (el host muestra la modal). */
  readonly bookingOpened  = output<BookingRequest>();
  /** Nueva fecha ISO al pulsar las flechas (el host actualiza el día mostrado). */
  readonly dateChange     = output<string>();

  readonly dateLabel = computed(() => {
    const d = this.date();
    return d ? new Date(d + 'T00:00').toLocaleDateString('es-ES',
      { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  });

  /** Emite la fecha desplazada `delta` días (±1) desde la actual. */
  shiftDay(delta: number): void {
    const base = this.date() ? new Date(this.date() + 'T00:00') : new Date();
    base.setDate(base.getDate() + delta);
    const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    this.dateChange.emit(iso);
  }

  readonly hours = computed(() => {
    const out: number[] = [];
    for (let h = this.dayStart(); h < this.dayEnd(); h++) out.push(h);
    return out;
  });

  readonly bodyHeight = computed(() => (this.dayEnd() - this.dayStart()) * this.hourHeight());

  readonly columns = computed<TimelineColumn[]>(() => {
    const day = this.date();
    const startMin = this.dayStart() * 60;
    const hh = this.hourHeight();
    const list = this.bookings().filter((b) => !day || b.date === day);
    return this.staff().map((s) => ({
      staff: s,
      events: list
        .filter((b) => b.staffId === s.id)
        .map((b) => {
          const dur = b.durationMinutes ?? 60;
          return {
            booking: b,
            top:    ((this.toMin(b.time) - startMin) / 60) * hh,
            height: (dur / 60) * hh,
            start:  b.time,
            end:    this.addMinutes(b.time, dur),
          };
        }),
    }));
  });

  onColumnClick(staff: Staff, event: MouseEvent): void {
    if (this.readonly()) return;   // día pasado: no se crean citas
    const y = event.offsetY;
    const minsFromStart = (y / this.hourHeight()) * 60 + this.dayStart() * 60;
    const snap = this.snapMinutes();
    const snapped = Math.round(minsFromStart / snap) * snap;
    this.slotClicked.emit({ staffId: staff.id, time: this.fromMin(snapped) });
  }

  /** Teclado: emite el alta al inicio del día para ese profesional (el ratón ajusta la hora exacta). */
  onColumnKey(staff: Staff): void {
    if (this.readonly()) return;
    this.slotClicked.emit({ staffId: staff.id, time: this.fromMin(this.dayStart() * 60) });
  }

  label(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
  }

  private toMin(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  private fromMin(total: number): string {
    const t = Math.max(0, Math.min(total, 24 * 60 - 1));
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }
  private addMinutes(time: string, minutes: number): string {
    return this.fromMin(this.toMin(time) + minutes);
  }
}
