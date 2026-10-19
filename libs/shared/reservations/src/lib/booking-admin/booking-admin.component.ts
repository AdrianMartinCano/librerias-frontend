import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService as Service, BookingRequest, Staff } from '@org/models';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { CalendarEventInput, buildIcs, googleCalendarUrl, outlookCalendarUrl, parseIcs } from '../calendar-export/calendar-ics';

interface BookingRow { booking: BookingRequest; index: number; start: string; end: string; }

/**
 * Panel de reservas para ADMIN: elige un día del calendario, da de alta una cita de X horas,
 * y gestiona (editar / cancelar) las reservas existentes de ese día. Valida solapamientos:
 * no deja crear/guardar una cita que pise el horario de otra el mismo día.
 *
 * Es un componente **controlado**: el padre posee el array `bookings` y reacciona a los eventos
 * `created` / `updated` / `cancelled` para actualizarlo (y enviarlo a spring-reservations).
 */
@Component({
  selector: 'lib-booking-admin',
  standalone: true,
  imports: [ReactiveFormsModule, BookingCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-badm">
      <div class="lib-badm__cal">
        <lib-booking-calendar
          mode="all"
          [busyDates]="busyDates()"
          [selected]="selectedDate()"
          (diaSeleccionado)="onDaySelected($event)"
        />
      </div>

      <form class="lib-badm__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <header class="lib-badm__head">
            <div>
              <h3 class="lib-badm__title">{{ editingIndex() !== null ? 'Editar reserva' : 'Nueva reserva' }}</h3>
              @if (selectedDate()) {
                <p class="lib-badm__subtitle">{{ selectedDayLabel() }}</p>
              } @else {
                <p class="lib-badm__subtitle lib-badm__subtitle--muted">Elige un día en el calendario</p>
              }
            </div>
            @if (editingIndex() !== null) {
              <span class="lib-badm__chip">Editando</span>
            }
          </header>

          <fieldset class="lib-badm__fields" [disabled]="!selectedDate()">
            @if (profesionales().length) {
              <div class="lib-field">
                <label class="lib-label" for="badm-staff">Profesional <span class="lib-required">*</span></label>
                <select id="badm-staff" class="lib-input lib-select" formControlName="staffId">
                  <option value="" disabled>Selecciona un profesional</option>
                  @for (p of profesionales(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
            }

            <div class="lib-field">
              <label class="lib-label" for="badm-service">Servicio <span class="lib-required">*</span></label>
              <select id="badm-service" class="lib-input lib-select" formControlName="serviceId" (change)="onServiceChange()">
                <option value="" disabled>Selecciona un servicio</option>
                @for (s of services(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>

            <div class="lib-field">
              <label class="lib-label" for="badm-time">Hora inicio <span class="lib-required">*</span></label>
              <input id="badm-time" class="lib-input" type="time" formControlName="time" />
            </div>

            <div class="lib-field">
              <label class="lib-label" for="badm-dur">Duración (min) <span class="lib-required">*</span></label>
              <input id="badm-dur" class="lib-input" type="number" min="5" step="5" formControlName="durationMinutes" />
            </div>

            @if (timeRange()) {
              <p class="lib-badm__range" aria-live="polite">🕒 {{ timeRange() }}</p>
            }

            <p class="lib-badm__section">Datos del cliente</p>

            <div class="lib-field">
              <label class="lib-label" for="badm-name">Nombre <span class="lib-required">*</span></label>
              <input id="badm-name" class="lib-input" type="text" formControlName="clientName" placeholder="Nombre y apellidos" />
            </div>

            <div class="lib-field">
              <label class="lib-label" for="badm-email">Email <span class="lib-required">*</span></label>
              <input id="badm-email" class="lib-input" type="email" formControlName="clientEmail" placeholder="email@ejemplo.com" />
            </div>

            <div class="lib-field">
              <label class="lib-label" for="badm-phone">Teléfono <span class="lib-required">*</span></label>
              <input id="badm-phone" class="lib-input" type="tel" formControlName="clientPhone" placeholder="+34 600 000 000" />
            </div>

            <div class="lib-field lib-field--full">
              <label class="lib-label" for="badm-notes">Notas</label>
              <textarea id="badm-notes" class="lib-input lib-textarea" formControlName="notes" rows="2" placeholder="Opcional"></textarea>
            </div>
          </fieldset>

          @if (overlapError()) {
            <p class="lib-badm__alert" role="alert">⚠️ {{ overlapError() }}</p>
          }

          <div class="lib-badm__actions">
            @if (editingIndex() !== null) {
              <button type="button" class="lib-badm__btn lib-badm__btn--ghost" (click)="cancelEdit()">Descartar</button>
            }
            <button type="submit" class="lib-badm__btn" [disabled]="form.invalid || !selectedDate() || loading()">
              @if (loading()) { <span class="lib-spinner lib-spinner--sm lib-spinner--inverse"></span> }
              {{ editingIndex() !== null ? 'Guardar cambios' : submitLabel() }}
            </button>
          </div>
        </form>

        <div class="lib-badm__toolbar">
        <!-- Exportar / importar -->
        <div class="lib-badm__tools">
          <button type="button" class="lib-badm__tool" (click)="exportAllIcs()" [disabled]="bookings().length === 0">
            ⬇ Exportar .ics
          </button>
          <label class="lib-badm__tool">
            ⭱ Importar .ics
            <input type="file" accept=".ics,text/calendar" (change)="onIcsSelected($event)" hidden />
          </label>
        </div>

        @if (importPreview().length) {
          <div class="lib-badm__import">
            <p class="lib-badm__import-title">Se importarán {{ importPreview().length }} evento(s):</p>
            <ul class="lib-badm__import-list">
              @for (ev of importPreview(); track $index) {
                <li>{{ ev.date }} · {{ ev.time }} — {{ ev.serviceName }}</li>
              }
            </ul>
            <div class="lib-badm__actions">
              <button type="button" class="lib-badm__btn lib-badm__btn--ghost" (click)="cancelImport()">Cancelar</button>
              <button type="button" class="lib-badm__btn" (click)="confirmImport()">Importar {{ importPreview().length }}</button>
            </div>
          </div>
        }
        @if (importMessage()) {
          <p class="lib-badm__msg" role="status">{{ importMessage() }}</p>
        }
      </div>

      <div class="lib-badm__side">
        @if (!selectedDate()) {
          <div class="lib-badm__list lib-badm__list--empty">
            <p class="lib-badm__empty">Elige un día en el calendario para ver y añadir sus reservas.</p>
          </div>
        } @else {
          <div class="lib-badm__list">
            <h4 class="lib-badm__list-title">Reservas del día · {{ dayBookings().length }}</h4>
            @if (dayBookings().length === 0) {
              <p class="lib-badm__empty">No hay reservas este día.</p>
            } @else {
              <ul class="lib-badm__bookings">
                @for (row of dayBookings(); track row.index) {
                  <li class="lib-badm__booking" [class.lib-badm__booking--active]="editingIndex() === row.index">
                    <div class="lib-badm__booking-top">
                      <span class="lib-badm__booking-time">{{ row.start }}–{{ row.end }}</span>
                      <span class="lib-badm__booking-acts">
                        <span class="lib-badm__menu">
                          <button type="button" class="lib-badm__icon" (click)="toggleMenu(row.index)"
                                  aria-haspopup="true" [attr.aria-expanded]="menuOpenIndex() === row.index"
                                  aria-label="Añadir a calendario" title="Añadir a calendario">📅</button>
                          @if (menuOpenIndex() === row.index) {
                            <span class="lib-badm__menu-pop" role="menu">
                              <a role="menuitem" [href]="googleUrl(row.booking)" target="_blank" rel="noopener noreferrer" (click)="menuOpenIndex.set(null)">Google Calendar</a>
                              <a role="menuitem" [href]="outlookUrl(row.booking)" target="_blank" rel="noopener noreferrer" (click)="menuOpenIndex.set(null)">Outlook</a>
                              <button type="button" role="menuitem" (click)="downloadEventIcs(row.booking)">Descargar .ics</button>
                            </span>
                          }
                        </span>
                        <button type="button" class="lib-badm__icon" (click)="editBooking(row.index)" aria-label="Editar reserva" title="Editar">✏️</button>
                        <button type="button" class="lib-badm__icon lib-badm__icon--danger" (click)="cancelBooking(row.index)" aria-label="Cancelar reserva" title="Cancelar">🗑️</button>
                      </span>
                    </div>
                    <span class="lib-badm__booking-info">
                      <strong>{{ row.booking.serviceName }}</strong>
                      <small>{{ row.booking.clientName }}</small>
                      @if (profesionales().length && staffNameOf(row.booking)) {
                        <small class="lib-badm__booking-staff">👤 {{ staffNameOf(row.booking) }}</small>
                      }
                    </span>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .lib-badm { display: grid; grid-template-columns: 1fr; gap: var(--space-5, 1.25rem); }
    @media (min-width: 980px) {
      .lib-badm {
        grid-template-columns: minmax(320px, 1.05fr) minmax(300px, .95fr);
        grid-template-areas:
          "cal   form"
          "bar   form"
          "list  form";
        align-items: start;
      }
      .lib-badm__cal     { grid-area: cal; }
      .lib-badm__toolbar { grid-area: bar; }
      .lib-badm__side    { grid-area: list; }
      .lib-badm__card    { grid-area: form; }
    }

    /* Calendario: tarjeta que llena su columna */
    .lib-badm__cal {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-4, 1rem);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,.06));
    }
    .lib-badm__cal lib-booking-calendar { display: block; }

    .lib-badm__side { display: flex; flex-direction: column; gap: var(--space-4, 1rem); }
    .lib-badm__toolbar { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-badm__list--empty {
      display: flex; align-items: center; justify-content: center; min-height: 120px; text-align: center;
      border-style: dashed;
    }

    .lib-badm__card {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-5, 1.25rem);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,.06));
      display: flex; flex-direction: column; gap: var(--space-4, 1rem);
    }

    .lib-badm__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3, .75rem); }
    .lib-badm__title { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .lib-badm__subtitle { font-size: var(--font-size-sm, .875rem); color: var(--color-text, #1a1a1a); text-transform: capitalize; margin-top: .15rem; }
    .lib-badm__subtitle--muted { color: var(--color-text-muted, #909090); text-transform: none; }
    .lib-badm__chip {
      font-size: var(--font-size-xs, .75rem); font-weight: var(--font-weight-semibold, 600);
      color: var(--color-accent, #ff4d4d);
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 14%, transparent);
      padding: .2rem .6rem; border-radius: 999px; white-space: nowrap;
    }

    /* Formulario horizontal: los campos fluyen en columnas según el ancho disponible */
    .lib-badm__fields {
      border: 0; padding: 0; margin: 0;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: var(--space-3, .75rem) var(--space-4, 1rem);
    }
    .lib-badm__fields:disabled { opacity: .55; }
    .lib-badm__section {
      grid-column: 1 / -1;
      font-size: var(--font-size-xs, .75rem); font-weight: var(--font-weight-semibold, 600);
      text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted, #909090);
      margin-top: var(--space-1, .35rem); padding-bottom: var(--space-1, .35rem);
      border-bottom: 1px solid var(--color-border, #e2e2e2);
    }
    .lib-field { display: flex; flex-direction: column; gap: var(--space-1, .35rem); min-width: 0; }
    .lib-field--full { grid-column: 1 / -1; }

    .lib-badm__range {
      grid-column: 1 / -1;
      font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-medium, 500);
      color: var(--color-accent, #ff4d4d);
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 10%, transparent);
      padding: var(--space-2, .5rem) var(--space-3, .75rem); border-radius: var(--radius-md, .5rem);
    }

    .lib-badm__alert {
      font-size: var(--font-size-sm, .875rem); color: var(--color-danger, #dc3545);
      background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger, #dc3545) 35%, transparent);
      padding: var(--space-2, .5rem) var(--space-3, .75rem); border-radius: var(--radius-md, .5rem);
    }

    .lib-badm__actions { display: flex; gap: var(--space-3, .75rem); }
    .lib-badm__btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      background: var(--color-accent, #ff4d4d); color: #fff; border: none;
      border-radius: var(--radius-md, .5rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; font-size: var(--font-size-base, 1rem); cursor: pointer;
      transition: filter var(--transition-fast, 120ms ease), opacity var(--transition-fast, 120ms ease);
    }
    .lib-badm__btn:not(:disabled):hover { filter: brightness(.93); }
    .lib-badm__btn:disabled { opacity: .5; cursor: not-allowed; }
    .lib-badm__btn--ghost {
      flex: 0 0 auto; background: transparent; color: var(--color-text-muted, #909090);
      border: 1px solid var(--color-border, #e2e2e2);
    }
    .lib-badm__btn--ghost:hover { filter: none; background: var(--color-surface, #f8f9fa); }

    .lib-badm__list {
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
    }
    .lib-badm__list { display: flex; flex-direction: column; }
    .lib-badm__list-title { font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); margin-bottom: var(--space-3, .75rem); }
    .lib-badm__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-badm__bookings { display: flex; flex-direction: column; gap: var(--space-2, .5rem); overflow: auto; }
    .lib-badm__booking {
      display: flex; flex-direction: column; gap: var(--space-1, .35rem);
      padding: var(--space-2, .5rem) var(--space-3, .75rem);
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-md, .5rem);
    }
    .lib-badm__booking--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-badm__booking-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2, .5rem); }
    .lib-badm__booking-time {
      font-variant-numeric: tabular-nums; font-weight: var(--font-weight-semibold, 600);
      font-size: var(--font-size-sm, .875rem); color: var(--color-accent, #ff4d4d); white-space: nowrap;
    }
    .lib-badm__booking-info { display: flex; flex-direction: column; min-width: 0; }
    .lib-badm__booking-info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-badm__booking-info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-badm__booking-staff { color: var(--color-accent, #ff4d4d) !important; font-weight: var(--font-weight-medium, 500); }
    .lib-badm__booking-acts { display: flex; gap: var(--space-1, .35rem); flex-shrink: 0; }
    .lib-badm__icon {
      width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: var(--radius-md, .5rem);
      cursor: pointer; font-size: .95rem; transition: background var(--transition-fast, 120ms ease);
    }
    .lib-badm__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-badm__icon--danger:hover { background: color-mix(in srgb, var(--color-danger, #dc3545) 14%, transparent); }
    .lib-badm__icon:focus-visible { outline: 2px solid var(--color-accent, #ff4d4d); outline-offset: 2px; }

    /* Barra exportar / importar */
    .lib-badm__tools { display: flex; gap: var(--space-3, .75rem); }
    .lib-badm__tool {
      flex: 1;
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-4, 1rem);
      font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-medium, 500); font-family: inherit;
      color: var(--color-text, #1a1a1a);
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-md, .5rem); cursor: pointer; white-space: nowrap;
      transition: background var(--transition-fast, 120ms ease);
    }
    .lib-badm__tool:hover:not(:disabled) { background: var(--color-surface, #f8f9fa); }
    .lib-badm__tool:focus-within, .lib-badm__tool:focus-visible { outline: 2px solid var(--color-accent, #ff4d4d); outline-offset: 2px; }
    .lib-badm__tool:has(:disabled), .lib-badm__tool[disabled] { opacity: .5; cursor: not-allowed; }

    /* Previsualización de import */
    .lib-badm__import {
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      display: flex; flex-direction: column; gap: var(--space-3, .75rem);
    }
    .lib-badm__import-title { font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); }
    .lib-badm__import-list { display: flex; flex-direction: column; gap: var(--space-1, .35rem); max-height: 180px; overflow: auto; font-size: var(--font-size-sm, .875rem); }
    .lib-badm__msg { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }

    /* Menú "añadir a calendario" por reserva */
    .lib-badm__menu { position: relative; display: inline-flex; }
    .lib-badm__menu-pop {
      position: absolute; top: calc(100% + 4px); right: 0; z-index: 10;
      display: flex; flex-direction: column; min-width: 160px;
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-md, .5rem);
      box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,.12));
      overflow: hidden;
    }
    .lib-badm__menu-pop a, .lib-badm__menu-pop button {
      text-align: left; padding: var(--space-2, .5rem) var(--space-3, .75rem);
      font-size: var(--font-size-sm, .875rem); font-family: inherit;
      color: var(--color-text, #1a1a1a); text-decoration: none;
      background: none; border: none; cursor: pointer;
    }
    .lib-badm__menu-pop a:hover, .lib-badm__menu-pop button:hover { background: var(--color-surface, #f8f9fa); }
  `],
})
export class BookingAdminComponent {
  readonly services    = input<Service[]>([]);
  /** Profesionales. Si hay alguno, el alta exige elegir uno y el solape se calcula por trabajador. */
  readonly profesionales = input<Staff[]>([]);
  /** Reservas existentes (el padre posee el array). Se usan para marcar el calendario,
   *  listar las del día y detectar solapamientos. */
  readonly bookings    = input<BookingRequest[]>([]);
  readonly loading     = input(false);
  readonly submitLabel = input('Crear reserva');
  /** Nombre del calendario para el `.ics` exportado. */
  readonly calendarName = input('Reservas');

  readonly created   = output<BookingRequest>();
  readonly updated   = output<{ index: number; booking: BookingRequest }>();
  readonly cancelled = output<number>();
  /** Eventos importados de un `.ics` (ya filtrados por solapamiento). El padre los añade. */
  readonly imported  = output<BookingRequest[]>();

  readonly selectedDate = signal<string | null>(null);
  readonly editingIndex = signal<number | null>(null);
  readonly overlapError = signal<string | null>(null);

  /** Índice de la reserva cuyo menú "añadir a calendario" está abierto. */
  readonly menuOpenIndex = signal<number | null>(null);
  /** Eventos parseados de un `.ics` pendientes de confirmar. */
  readonly importPreview = signal<BookingRequest[]>([]);
  readonly importMessage = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    staffId:     [''],
    serviceId:   ['', Validators.required],
    time:        ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(5)]],
    clientName:  ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.required],
    notes:       [''],
  });

  private readonly servicesById = computed(() =>
    new Map(this.services().map((s) => [s.id, s])),
  );

  private readonly staffById = computed(() =>
    new Map(this.profesionales().map((p) => [p.id, p])),
  );

  staffNameOf(b: BookingRequest): string {
    return b.staffName ?? (b.staffId ? this.staffById().get(b.staffId)?.name ?? '' : '');
  }

  /** Filas (con índice global) de las reservas del día seleccionado, ordenadas por hora. */
  readonly dayBookings = computed<BookingRow[]>(() => {
    const date = this.selectedDate();
    if (!date) return [];
    return this.bookings()
      .map((booking, index) => ({ booking, index }))
      .filter(({ booking }) => booking.date === date)
      .map(({ booking, index }) => ({
        booking, index,
        start: booking.time,
        end: this.addMinutes(booking.time, this.durationOf(booking)),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  });

  readonly busyDates = computed(() => [...new Set(this.bookings().map((b) => b.date))]);

  readonly selectedDayLabel = computed(() => {
    const d = this.selectedDate();
    return d ? new Date(d + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  });

  /** Rango horario calculado de lo que se está creando/editando. */
  readonly timeRange = computed(() => {
    const time = this.formTime();
    const min = this.formDuration();
    if (!time || !min || min <= 0) return '';
    return `${time} – ${this.addMinutes(time, min)}`;
  });

  // Espejos reactivos de los campos que necesita timeRange().
  private readonly formTime = signal(this.form.controls.time.value ?? '');
  private readonly formDuration = signal(this.form.controls.durationMinutes.value ?? 60);

  constructor() {
    this.form.controls.time.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.formTime.set(v ?? ''));
    this.form.controls.durationMinutes.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.formDuration.set(v ?? 0));

    // Si la duración no se ha tocado, prefija la del servicio elegido.
    effect(() => {
      const id = this.form.controls.serviceId.value;
      const svc = id ? this.servicesById().get(id) : undefined;
      if (svc && !this.form.controls.durationMinutes.dirty) {
        this.form.controls.durationMinutes.setValue(svc.durationMinutes);
      }
    });
  }

  onDaySelected(date: string): void {
    this.selectedDate.set(date);
    this.cancelEdit(); // al cambiar de día, salimos del modo edición
  }

  onServiceChange(): void {
    this.form.controls.durationMinutes.markAsPristine(); // permite re-prefijar al cambiar de servicio
  }

  editBooking(index: number): void {
    const b = this.bookings()[index];
    if (!b) return;
    this.editingIndex.set(index);
    this.overlapError.set(null);
    this.form.reset({
      staffId:     b.staffId ?? '',
      serviceId:   b.serviceId,
      time:        b.time,
      durationMinutes: this.durationOf(b),
      clientName:  b.clientName,
      clientEmail: b.clientEmail,
      clientPhone: b.clientPhone,
      notes:       b.notes ?? '',
    });
    this.form.controls.durationMinutes.markAsDirty(); // no re-prefijar al cargar
  }

  cancelBooking(index: number): void {
    if (this.editingIndex() === index) this.cancelEdit();
    this.cancelled.emit(index);
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
    this.overlapError.set(null);
    this.form.reset({ staffId: '', serviceId: '', time: '', durationMinutes: 60, clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  }

  submit(): void {
    const date = this.selectedDate();
    if (this.form.invalid || !date) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const staffId = v.staffId || undefined;
    if (this.profesionales().length && !staffId) {
      this.overlapError.set('Elige un profesional para la cita.');
      return;
    }
    const durationMinutes = v.durationMinutes ?? 60;
    const start = v.time ?? '';
    const end = this.addMinutes(start, durationMinutes);

    // El solape es por trabajador: solo choca con citas del mismo profesional (o con todas si no hay).
    const overlap = this.findOverlap(date, start, end, this.editingIndex(), staffId);
    if (overlap) {
      this.overlapError.set(`Se solapa con otra reserva (${overlap.start}–${overlap.end}). Elige otra hora.`);
      return;
    }
    this.overlapError.set(null);

    const svc = this.servicesById().get(v.serviceId ?? '');
    const staff = staffId ? this.staffById().get(staffId) : undefined;
    const booking: BookingRequest = {
      serviceId:   v.serviceId ?? '',
      serviceName: svc?.name ?? '',
      date,
      time:        start,
      clientName:  v.clientName ?? '',
      clientEmail: v.clientEmail ?? '',
      clientPhone: v.clientPhone ?? '',
      notes:       v.notes || undefined,
      durationMinutes,
      staffId,
      staffName:   staff?.name,
      staffColor:  staff?.color,
    };

    const editing = this.editingIndex();
    if (editing !== null) {
      this.updated.emit({ index: editing, booking });
    } else {
      this.created.emit(booking);
    }
    this.cancelEdit();
  }

  /**
   * Devuelve la primera reserva del día que se solapa con [start, end), ignorando `exceptIndex`. Si se
   * pasa `staffId`, solo considera las citas de ESE profesional (cada uno es una agenda independiente).
   */
  private findOverlap(date: string, start: string, end: string,
                      exceptIndex: number | null, staffId?: string): BookingRow | null {
    const s = this.toMin(start), e = this.toMin(end);
    for (const row of this.dayBookingsFor(date)) {
      if (row.index === exceptIndex) continue;
      if (staffId && row.booking.staffId !== staffId) continue; // otra agenda: no choca
      const rs = this.toMin(row.start), re = this.toMin(row.end);
      if (s < re && rs < e) return row; // hay intersección
    }
    return null;
  }

  private dayBookingsFor(date: string): BookingRow[] {
    return this.bookings()
      .map((booking, index) => ({ booking, index }))
      .filter(({ booking }) => booking.date === date)
      .map(({ booking, index }) => ({
        booking, index,
        start: booking.time,
        end: this.addMinutes(booking.time, this.durationOf(booking)),
      }));
  }

  private durationOf(b: BookingRequest): number {
    return b.durationMinutes ?? this.servicesById().get(b.serviceId)?.durationMinutes ?? 60;
  }

  /* ── Exportar / importar calendario (.ics + deep links) ── */

  toggleMenu(index: number): void {
    this.menuOpenIndex.update((cur) => (cur === index ? null : index));
  }

  googleUrl(b: BookingRequest): string { return googleCalendarUrl(this.eventOf(b)); }
  outlookUrl(b: BookingRequest): string { return outlookCalendarUrl(this.eventOf(b)); }

  /** Descarga el `.ics` de una reserva concreta. */
  downloadEventIcs(b: BookingRequest): void {
    this.menuOpenIndex.set(null);
    this.download(`reserva-${b.date}.ics`, buildIcs([this.eventOf(b)], this.calendarName()));
  }

  /** Descarga un `.ics` con todas las reservas. */
  exportAllIcs(): void {
    const events = this.bookings().map((b) => this.eventOf(b));
    if (events.length === 0) return;
    this.download('reservas.ics', buildIcs(events, this.calendarName()));
  }

  /** Lee un `.ics` seleccionado y prepara la previsualización de import. */
  onIcsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite re-seleccionar el mismo archivo
    if (!file) return;

    file.text().then((text) => {
      const mapped = parseIcs(text).map<BookingRequest>((ev) => ({
        serviceId: '',
        serviceName: ev.title,
        date: ev.date,
        time: ev.time,
        durationMinutes: ev.durationMinutes,
        clientName: 'Importado',
        clientEmail: '',
        clientPhone: '',
        notes: ev.description || undefined,
      }));
      this.importPreview.set(mapped);
      this.importMessage.set(mapped.length ? null : 'No se encontraron eventos en el archivo.');
    });
  }

  /** Confirma el import: emite los eventos que NO se solapan (con los existentes ni entre sí). */
  confirmImport(): void {
    const ranges = this.bookings().map((b) => ({ date: b.date, start: b.time, end: this.addMinutes(b.time, this.durationOf(b)) }));
    const accepted: BookingRequest[] = [];
    let skipped = 0;

    for (const ev of this.importPreview()) {
      const start = ev.time;
      const end = this.addMinutes(ev.time, ev.durationMinutes ?? 60);
      const clash = ranges.some((r) => r.date === ev.date && this.toMin(start) < this.toMin(r.end) && this.toMin(r.start) < this.toMin(end));
      if (clash) { skipped++; continue; }
      accepted.push(ev);
      ranges.push({ date: ev.date, start, end });
    }

    if (accepted.length) this.imported.emit(accepted);
    this.importPreview.set([]);
    this.importMessage.set(`Importadas ${accepted.length}${skipped ? ` · ${skipped} omitidas por solaparse` : ''}.`);
  }

  cancelImport(): void {
    this.importPreview.set([]);
    this.importMessage.set(null);
  }

  private eventOf(b: BookingRequest): CalendarEventInput {
    return {
      title: b.clientName ? `${b.serviceName} — ${b.clientName}` : b.serviceName,
      date: b.date,
      time: b.time,
      durationMinutes: this.durationOf(b),
      description: b.notes,
    };
  }

  private download(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private toMin(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private addMinutes(time: string, minutes: number): string {
    const total = this.toMin(time) + minutes;
    const hh = Math.floor((total % (24 * 60)) / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
}
