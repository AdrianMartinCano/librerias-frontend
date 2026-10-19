import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import {
  CreateDiningReservationRequest, SeatingAvailability, SpecialRequest, Zone,
} from '@org/models';
import { DiningBookingStateService } from '../dining-booking-state.service';

/** Petición de disponibilidad que el host debe resolver (carga `availability`). */
export interface AvailabilityQuery {
  date:    string;
  party:   number;
  zoneId:  string | null;
}

const REQUEST_LABELS: Record<SpecialRequest, string> = {
  TRONA:       'Trona / silla alta',
  ACCESIBLE:   'Acceso silla de ruedas',
  TERRAZA:     'Terraza',
  INTERIOR:    'Interior',
  TRANQUILA:   'Zona tranquila',
  CELEBRACION: 'Celebración',
  ALERGIAS:    'Alergias / intolerancias',
};

/**
 * Flujo público de reserva de mesa: comensales → fecha → turno → datos → confirmación.
 * Componente **controlado**: el host posee los datos y hace el HTTP.
 * - Provee `zones` y `availability`.
 * - Escucha `availabilityRequested` para cargar la disponibilidad de la fecha/comensales.
 * - Escucha `reservaConfirmada` para crear la reserva (POST /api/dining/reservations).
 */
@Component({
  selector: 'lib-dining-booking-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-dbf">
      @switch (state.step()) {

        @case ('party') {
          <h3 class="lib-dbf__title">¿Cuántos sois?</h3>
          <div class="lib-dbf__party">
            <button type="button" class="lib-dbf__step" (click)="changeParty(-1)" [disabled]="party() <= 1" aria-label="Menos">−</button>
            <span class="lib-dbf__party-n">{{ party() }}</span>
            <button type="button" class="lib-dbf__step" (click)="changeParty(1)" [disabled]="party() >= maxParty()" aria-label="Más">+</button>
            <span class="lib-dbf__party-label">{{ party() === 1 ? 'comensal' : 'comensales' }}</span>
          </div>

          @if (zones().length > 0) {
            <label class="lib-dbf__field">
              <span>Zona (opcional)</span>
              <select (change)="onZone($event)">
                <option value="">Cualquiera</option>
                @for (z of zones(); track z.id) {
                  <option [value]="z.id" [selected]="state.zoneId() === z.id">{{ z.name }}</option>
                }
              </select>
            </label>
          }
          <button type="button" class="lib-dbf__next" (click)="goToDate()">Continuar</button>
        }

        @case ('date') {
          <h3 class="lib-dbf__title">¿Qué día?</h3>
          <label class="lib-dbf__field">
            <span>Fecha</span>
            <input type="date" [min]="today" [value]="state.selectedDate() ?? ''" (change)="onDate($event)" />
          </label>
          <div class="lib-dbf__nav">
            <button type="button" class="lib-dbf__back" (click)="state.prev()">Atrás</button>
          </div>
        }

        @case ('seating') {
          <h3 class="lib-dbf__title">Elige turno</h3>
          @if (loading()) {
            <p class="lib-dbf__muted">Buscando disponibilidad…</p>
          } @else if (bookableSeatings().length === 0) {
            <p class="lib-dbf__muted">No hay turnos con mesa para {{ party() }} ese día. Prueba otra fecha.</p>
          } @else {
            <div class="lib-dbf__seatings">
              @for (s of availability(); track s.seatingId) {
                <button
                  type="button"
                  class="lib-dbf__seating"
                  [class.lib-dbf__seating--selected]="state.selectedSeating()?.seatingId === s.seatingId"
                  [disabled]="!s.available"
                  (click)="state.setSeating(s)"
                >
                  <span class="lib-dbf__seating-name">{{ s.seatingName }}</span>
                  <span class="lib-dbf__seating-time">{{ s.start }}–{{ s.end }}</span>
                  @if (!s.available) { <span class="lib-dbf__seating-full">Completo</span> }
                </button>
              }
            </div>
          }
          <div class="lib-dbf__nav">
            <button type="button" class="lib-dbf__back" (click)="state.prev()">Atrás</button>
            <button type="button" class="lib-dbf__next" [disabled]="!state.canGoNext()" (click)="state.next()">Continuar</button>
          </div>
        }

        @case ('form') {
          <h3 class="lib-dbf__title">Tus datos</h3>
          <p class="lib-dbf__summary">
            {{ party() }} {{ party() === 1 ? 'comensal' : 'comensales' }} ·
            {{ state.selectedDate() }} · {{ state.selectedSeating()?.seatingName }}
            ({{ state.selectedSeating()?.start }})
          </p>
          <label class="lib-dbf__field"><span>Nombre</span>
            <input type="text" [value]="name()" (input)="name.set($any($event.target).value)" />
          </label>
          <label class="lib-dbf__field"><span>Email</span>
            <input type="email" [value]="email()" (input)="email.set($any($event.target).value)" />
          </label>
          <label class="lib-dbf__field"><span>Teléfono</span>
            <input type="tel" [value]="phone()" (input)="phone.set($any($event.target).value)" />
          </label>
          <label class="lib-dbf__field"><span>Notas (opcional)</span>
            <textarea rows="2" [value]="notes()" (input)="notes.set($any($event.target).value)"></textarea>
          </label>

          <fieldset class="lib-dbf__requests">
            <legend>Peticiones</legend>
            @for (r of requestOptions; track r.value) {
              <label class="lib-dbf__chk">
                <input type="checkbox" [checked]="requests().includes(r.value)" (change)="toggleRequest(r.value)" />
                {{ r.label }}
              </label>
            }
          </fieldset>

          <div class="lib-dbf__nav">
            <button type="button" class="lib-dbf__back" (click)="state.prev()">Atrás</button>
            <button type="button" class="lib-dbf__next" [disabled]="!formValid() || loading()" (click)="confirm()">
              {{ loading() ? 'Enviando…' : 'Confirmar reserva' }}
            </button>
          </div>
        }

        @case ('success') {
          <div class="lib-dbf__success">
            <p class="lib-dbf__success-icon">✓</p>
            <p>{{ successMessage() }}</p>
            <button type="button" class="lib-dbf__next" (click)="state.reset()">Nueva reserva</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .lib-dbf { display: flex; flex-direction: column; gap: var(--space-4, 1rem); }
    .lib-dbf__title { margin: 0; font-size: var(--font-size-lg, 1.125rem); color: var(--color-text, #1a1a1a); }
    .lib-dbf__muted { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .lib-dbf__party { display: flex; align-items: center; gap: var(--space-3, .75rem); }
    .lib-dbf__party-n { font-size: var(--font-size-xl, 1.5rem); font-weight: var(--font-weight-bold, 700); min-width: 2ch; text-align: center; }
    .lib-dbf__party-label { color: var(--color-text-secondary, #595959); }
    .lib-dbf__step {
      width: 2.5rem; height: 2.5rem; border-radius: var(--radius-full, 999px);
      border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff);
      font-size: 1.25rem; cursor: pointer; color: var(--color-text, #1a1a1a);
    }
    .lib-dbf__step:disabled { opacity: .4; cursor: not-allowed; }
    .lib-dbf__field { display: flex; flex-direction: column; gap: var(--space-1, .25rem); font-size: var(--font-size-sm, .875rem); }
    .lib-dbf__field input, .lib-dbf__field select, .lib-dbf__field textarea {
      padding: var(--space-2, .5rem) var(--space-3, .75rem);
      border: 1.5px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem);
      font-family: inherit; font-size: var(--font-size-base, 1rem); background: var(--color-background, #fff);
      color: var(--color-text, #1a1a1a);
    }
    .lib-dbf__seatings { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-2, .5rem); }
    .lib-dbf__seating {
      display: flex; flex-direction: column; gap: .15rem; padding: var(--space-3, .75rem);
      border: 1.5px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem);
      background: var(--color-background, #fff); cursor: pointer; text-align: left; color: var(--color-text, #1a1a1a);
    }
    .lib-dbf__seating:hover:not(:disabled) { border-color: var(--color-accent, #ff4d4d); }
    .lib-dbf__seating--selected { border-color: var(--color-accent, #ff4d4d) !important; background: var(--color-accent-soft, #fff0f0); }
    .lib-dbf__seating:disabled { opacity: .4; cursor: not-allowed; }
    .lib-dbf__seating-name { font-weight: var(--font-weight-medium, 500); }
    .lib-dbf__seating-time { font-size: var(--font-size-sm, .875rem); color: var(--color-text-secondary, #595959); }
    .lib-dbf__seating-full { font-size: var(--font-size-xs, .75rem); color: var(--color-danger, #d33); }
    .lib-dbf__summary { font-size: var(--font-size-sm, .875rem); color: var(--color-text-secondary, #595959); }
    .lib-dbf__requests { border: 1px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem); padding: var(--space-3, .75rem); display: flex; flex-wrap: wrap; gap: var(--space-2, .5rem); }
    .lib-dbf__requests legend { font-size: var(--font-size-sm, .875rem); color: var(--color-text-secondary, #595959); padding: 0 var(--space-1, .25rem); }
    .lib-dbf__chk { display: flex; align-items: center; gap: .35rem; font-size: var(--font-size-sm, .875rem); }
    .lib-dbf__nav { display: flex; justify-content: space-between; gap: var(--space-2, .5rem); }
    .lib-dbf__next, .lib-dbf__back {
      padding: var(--space-2, .5rem) var(--space-5, 1.25rem); border-radius: var(--radius-md, .5rem);
      font-family: inherit; font-weight: var(--font-weight-medium, 500); cursor: pointer; border: 1.5px solid transparent;
    }
    .lib-dbf__next { background: var(--color-accent, #ff4d4d); color: #fff; }
    .lib-dbf__next:disabled { opacity: .5; cursor: not-allowed; }
    .lib-dbf__back { background: transparent; border-color: var(--color-border, #e0e0e0); color: var(--color-text, #1a1a1a); }
    .lib-dbf__success { text-align: center; padding: var(--space-6, 1.5rem); display: flex; flex-direction: column; gap: var(--space-3, .75rem); align-items: center; }
    .lib-dbf__success-icon {
      width: 3rem; height: 3rem; border-radius: var(--radius-full, 999px); background: var(--color-success, #2e9e5b);
      color: #fff; font-size: 1.5rem; display: grid; place-items: center; margin: 0;
    }
  `],
})
export class DiningBookingFormComponent {
  readonly state = inject(DiningBookingStateService);

  /** Zonas disponibles (preferencia opcional del cliente). */
  readonly zones = input<Zone[]>([]);
  /** Disponibilidad por turno para la fecha/comensales actuales (la provee el host). */
  readonly availability = input<SeatingAvailability[]>([]);
  /** Capacidad máxima por reserva ofrecida en el selector de comensales. */
  readonly maxParty = input<number>(12);
  readonly loading = input<boolean>(false);
  readonly successMessage = input<string>('¡Reserva recibida! Te confirmaremos en breve.');

  /** El host carga la disponibilidad cuando se solicita (al elegir fecha). */
  readonly availabilityRequested = output<AvailabilityQuery>();
  /** El host crea la reserva. */
  readonly reservaConfirmada = output<CreateDiningReservationRequest>();

  readonly today = new Date().toISOString().slice(0, 10);
  readonly requestOptions = (Object.keys(REQUEST_LABELS) as SpecialRequest[])
    .map(value => ({ value, label: REQUEST_LABELS[value] }));

  // Local form state
  readonly name     = signal('');
  readonly email    = signal('');
  readonly phone    = signal('');
  readonly notes    = signal('');
  readonly requests = signal<SpecialRequest[]>([]);

  readonly party = computed(() => this.state.partySize() ?? 1);

  readonly bookableSeatings = computed(() => this.availability().filter(s => s.available));

  readonly formValid = computed(() =>
    this.name().trim().length > 0 &&
    /.+@.+\..+/.test(this.email()) &&
    this.phone().trim().length > 0);

  changeParty(delta: number): void {
    const next = Math.min(Math.max(this.party() + delta, 1), this.maxParty());
    this.state.setParty(next);
  }

  onZone(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    this.state.setZone(value || null);
  }

  goToDate(): void {
    if (this.state.partySize() == null) this.state.setParty(this.party());
    this.state.next();
  }

  onDate(e: Event): void {
    const date = (e.target as HTMLInputElement).value;
    if (!date) return;
    this.state.setDate(date);
    this.availabilityRequested.emit({ date, party: this.party(), zoneId: this.state.zoneId() });
    this.state.next();
  }

  toggleRequest(r: SpecialRequest): void {
    const set = new Set(this.requests());
    if (set.has(r)) set.delete(r); else set.add(r);
    this.requests.set([...set]);
  }

  confirm(): void {
    const seating = this.state.selectedSeating();
    const date = this.state.selectedDate();
    if (!seating || !date || !this.formValid()) return;
    this.reservaConfirmada.emit({
      date,
      seatingId:   seating.seatingId,
      partySize:   this.party(),
      clientName:  this.name().trim(),
      clientEmail: this.email().trim(),
      clientPhone: this.phone().trim(),
      notes:       this.notes().trim() || undefined,
      requests:    this.requests(),
      zoneId:      this.state.zoneId() ?? undefined,
    });
  }

  /** El host llama a esto (vía template ref) tras crear la reserva con éxito. */
  showSuccess(): void {
    this.state.step.set('success');
  }
}
