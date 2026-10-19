import { Component, ChangeDetectionStrategy, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  DiningReservation, DiningReservationStatus, DiningTable, Seating,
  SpecialRequest, UpdateDiningReservationRequest,
} from '@org/models';

const STATUSES: { value: DiningReservationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' }, { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'SEATED', label: 'Sentados' }, { value: 'COMPLETED', label: 'Completada' },
  { value: 'NO_SHOW', label: 'No-show' }, { value: 'CANCELLED', label: 'Cancelada' },
];

const REQUESTS: { value: SpecialRequest; label: string }[] = [
  { value: 'TRONA', label: 'Trona' }, { value: 'ACCESIBLE', label: 'Accesible' },
  { value: 'TERRAZA', label: 'Terraza' }, { value: 'INTERIOR', label: 'Interior' },
  { value: 'TRANQUILA', label: 'Tranquila' }, { value: 'CELEBRACION', label: 'Celebración' },
  { value: 'ALERGIAS', label: 'Alergias' },
];

/**
 * Modal de detalle y edición completa de una reserva: fecha, turno, comensales, datos del cliente,
 * estado, peticiones y mesas asignadas. Componente controlado: el host hace `PUT` con el payload de
 * `saved` y cierra con `closed`. Se muestra cuando `reservation` no es null.
 */
@Component({
  selector: 'lib-dining-reservation-detail',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (reservation(); as r) {
      <div class="lib-rd__overlay" role="button" tabindex="0" aria-label="Cerrar"
           (click)="closed.emit()" (keydown.escape)="closed.emit()">
        <form class="lib-rd" role="dialog" aria-modal="true" tabindex="-1"
              [formGroup]="form" (ngSubmit)="submit()"
              (click)="$event.stopPropagation()" (keydown.escape)="closed.emit()" novalidate>
          <header class="lib-rd__head">
            <h3 class="lib-rd__title">Reserva · {{ r.clientName }}</h3>
            <button type="button" class="lib-rd__x" (click)="closed.emit()" aria-label="Cerrar">✕</button>
          </header>

          <div class="lib-rd__row">
            <div class="lib-field lib-rd__grow">
              <label class="lib-label" for="rd-date">Fecha</label>
              <input id="rd-date" class="lib-input" type="date" formControlName="date" />
            </div>
            <div class="lib-field lib-rd__grow">
              <label class="lib-label" for="rd-seating">Turno</label>
              <select id="rd-seating" class="lib-input" formControlName="seatingId">
                @for (s of seatings(); track s.id) { <option [value]="s.id">{{ s.name }} ({{ s.start }})</option> }
              </select>
            </div>
            <div class="lib-field">
              <label class="lib-label" for="rd-party">Personas</label>
              <input id="rd-party" class="lib-input lib-rd__party" type="number" min="1" formControlName="partySize" />
            </div>
          </div>

          <div class="lib-rd__row">
            <div class="lib-field lib-rd__grow">
              <label class="lib-label" for="rd-name">Nombre</label>
              <input id="rd-name" class="lib-input" type="text" formControlName="clientName" />
            </div>
            <div class="lib-field lib-rd__grow">
              <label class="lib-label" for="rd-phone">Teléfono</label>
              <input id="rd-phone" class="lib-input" type="tel" formControlName="clientPhone" />
            </div>
          </div>

          <div class="lib-field">
            <label class="lib-label" for="rd-email">Email</label>
            <input id="rd-email" class="lib-input" type="email" formControlName="clientEmail" />
          </div>

          <div class="lib-field">
            <label class="lib-label" for="rd-notes">Notas</label>
            <textarea id="rd-notes" class="lib-input" rows="2" formControlName="notes"></textarea>
          </div>

          <div class="lib-field">
            <label class="lib-label" for="rd-status">Estado</label>
            <select id="rd-status" class="lib-input" formControlName="status">
              @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
            </select>
          </div>

          <div class="lib-field">
            <span class="lib-label">Peticiones</span>
            <div class="lib-rd__chips">
              @for (req of requestOptions; track req.value) {
                <button type="button" class="lib-rd__chip" [class.lib-rd__chip--on]="selectedRequests().includes(req.value)" (click)="toggleRequest(req.value)">{{ req.label }}</button>
              }
            </div>
          </div>

          <div class="lib-field">
            <span class="lib-label">Mesas</span>
            <div class="lib-rd__tables">
              @for (t of tables(); track t.id) {
                <button type="button" class="lib-rd__table" [class.lib-rd__table--on]="selectedTables().includes(t.id)" (click)="toggleTable(t.id)">
                  {{ t.label }} <small>({{ t.capacityMax }})</small>
                </button>
              }
            </div>
            <small class="lib-rd__hint">Capacidad seleccionada: {{ selectedCapacity() }} personas</small>
          </div>

          <div class="lib-rd__actions">
            <button type="button" class="lib-rd__cancel" (click)="closed.emit()">Cerrar</button>
            <button type="submit" class="lib-rd__save" [disabled]="form.invalid || selectedTables().length === 0 || loading()">
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .lib-rd__overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: center; padding: var(--space-4, 1rem); z-index: 1000; }
    .lib-rd { background: var(--color-background, #fff); border-radius: var(--radius-lg, .75rem); padding: var(--space-5, 1.25rem); width: min(560px, 100%); max-height: 90vh; overflow: auto; display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-rd__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-rd__title { margin: 0; font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-rd__x { border: none; background: transparent; font-size: 1.1rem; cursor: pointer; color: var(--color-text-secondary, #595959); }
    .lib-rd__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-rd__grow { flex: 1; }
    .lib-rd__party { width: 72px; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-rd__chips, .lib-rd__tables { display: flex; flex-wrap: wrap; gap: .35rem; }
    .lib-rd__chip, .lib-rd__table { border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff); border-radius: var(--radius-md, .5rem); padding: .3rem .6rem; cursor: pointer; font-family: inherit; font-size: var(--font-size-sm, .875rem); color: var(--color-text, #1a1a1a); }
    .lib-rd__chip--on, .lib-rd__table--on { background: var(--color-accent, #ff4d4d); border-color: var(--color-accent, #ff4d4d); color: #fff; }
    .lib-rd__hint { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-rd__actions { display: flex; justify-content: flex-end; gap: var(--space-2, .5rem); margin-top: var(--space-2, .5rem); }
    .lib-rd__cancel { background: transparent; border: 1.5px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem); padding: var(--space-2, .5rem) var(--space-4, 1rem); cursor: pointer; font-family: inherit; }
    .lib-rd__save { background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); padding: var(--space-2, .5rem) var(--space-5, 1.25rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-rd__save:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ReservationDetailComponent {
  readonly reservation = input<DiningReservation | null>(null);
  readonly tables      = input<DiningTable[]>([]);
  readonly seatings    = input<Seating[]>([]);
  readonly loading     = input(false);

  readonly saved  = output<{ id: string; payload: UpdateDiningReservationRequest }>();
  readonly closed = output<void>();

  readonly statuses = STATUSES;
  readonly requestOptions = REQUESTS;

  readonly selectedTables   = signal<string[]>([]);
  readonly selectedRequests = signal<SpecialRequest[]>([]);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    date:        ['', Validators.required],
    seatingId:   ['', Validators.required],
    partySize:   [2, [Validators.required, Validators.min(1)]],
    clientName:  ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.required],
    notes:       [''],
    status:      ['PENDING' as DiningReservationStatus, Validators.required],
  });

  constructor() {
    effect(() => {
      const r = this.reservation();
      if (!r) return;
      this.form.reset({
        date: r.date, seatingId: r.seatingId, partySize: r.partySize,
        clientName: r.clientName, clientEmail: r.clientEmail, clientPhone: r.clientPhone,
        notes: r.notes ?? '', status: r.status,
      });
      this.selectedTables.set(r.tables.map(t => t.id));
      this.selectedRequests.set([...r.requests]);
    });
  }

  selectedCapacity(): number {
    const ids = new Set(this.selectedTables());
    return this.tables().filter(t => ids.has(t.id)).reduce((sum, t) => sum + t.capacityMax, 0);
  }

  toggleTable(id: string): void {
    const set = new Set(this.selectedTables());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.selectedTables.set([...set]);
  }

  toggleRequest(r: SpecialRequest): void {
    const set = new Set(this.selectedRequests());
    if (set.has(r)) set.delete(r); else set.add(r);
    this.selectedRequests.set([...set]);
  }

  submit(): void {
    const r = this.reservation();
    if (!r || this.form.invalid || this.selectedTables().length === 0) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: UpdateDiningReservationRequest = {
      date:        v.date ?? '',
      seatingId:   v.seatingId ?? '',
      partySize:   v.partySize ?? 1,
      clientName:  v.clientName ?? '',
      clientEmail: v.clientEmail ?? '',
      clientPhone: v.clientPhone ?? '',
      notes:       v.notes || undefined,
      status:      v.status ?? 'PENDING',
      requests:    this.selectedRequests(),
      tableIds:    this.selectedTables(),
    };
    this.saved.emit({ id: r.id, payload });
  }
}
