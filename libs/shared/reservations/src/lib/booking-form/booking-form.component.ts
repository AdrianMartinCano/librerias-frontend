import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService as Service, TimeSlot, BookingRequest, BookingStep } from '@org/models';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { BookingSlotsComponent }    from '../booking-slots/booking-slots.component';
import { BookingStateService }      from '../booking.service';

const STEP_LABELS: Record<BookingStep, string> = {
  service: 'Servicio', date: 'Fecha', time: 'Hora', form: 'Datos', success: '',
};

@Component({
  selector: 'lib-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, BookingCalendarComponent, BookingSlotsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-booking">

      <!-- Indicador de pasos -->
      @if (state.step() !== 'success') {
        <div class="lib-booking__steps">
          @for (s of stepList; track s.id) {
            <div class="lib-booking__step"
              [class.lib-booking__step--active]="state.step() === s.id"
              [class.lib-booking__step--done]="isStepDone(s.id)">
              <span class="lib-booking__step-dot">
                @if (isStepDone(s.id)) { ✓ } @else { {{ s.num }} }
              </span>
              <span class="lib-booking__step-label">{{ s.label }}</span>
            </div>
          }
        </div>
      }

      <!-- Paso 1: Selección de servicio -->
      @if (state.step() === 'service') {
        <div class="lib-booking__section">
          <h2 class="lib-booking__title">¿Qué servicio necesitas?</h2>
          <div class="lib-booking__services">
            @for (s of servicios(); track s.id) {
              <button
                type="button"
                class="lib-booking__service-card"
                [class.lib-booking__service-card--selected]="state.selectedService()?.id === s.id"
                (click)="selectService(s)"
              >
                @if (s.imageUrl) {
                  <img [src]="s.imageUrl" [alt]="s.name" class="lib-booking__service-img" />
                } @else {
                  <div class="lib-booking__service-icon" [style.background]="s.color || 'var(--color-accent)'">
                    {{ s.name[0] }}
                  </div>
                }
                <div class="lib-booking__service-info">
                  <p class="lib-booking__service-name">{{ s.name }}</p>
                  @if (s.description) { <p class="lib-booking__service-desc">{{ s.description }}</p> }
                  <div class="lib-booking__service-meta">
                    <span>⏱ {{ s.durationMinutes }} min</span>
                    @if (s.price) { <span>💶 {{ formatPrice(s.price) }}</span> }
                  </div>
                </div>
              </button>
            }
          </div>
          <div class="lib-booking__actions">
            <button type="button" class="lib-booking__btn-primary"
              [disabled]="!state.canGoNext()" (click)="state.nextStep()">
              Elegir fecha →
            </button>
          </div>
        </div>
      }

      <!-- Paso 2: Selección de fecha -->
      @if (state.step() === 'date') {
        <div class="lib-booking__section">
          <h2 class="lib-booking__title">¿Qué día prefieres?</h2>
          <p class="lib-booking__subtitle">Servicio: <strong>{{ state.selectedService()?.name }}</strong></p>
          @if (cargando()) {
            <div class="lib-booking__loading">
              <span class="lib-spinner" style="color:var(--color-accent)"></span>
              Cargando disponibilidad...
            </div>
          } @else {
            <lib-booking-calendar
              [disponibilidad]="disponibilidad()"
              [selected]="state.selectedDate()"
              (diaSeleccionado)="selectDate($event)"
            />
          }
          <div class="lib-booking__actions">
            <button type="button" class="lib-booking__btn-secondary" (click)="state.prevStep()">← Volver</button>
            <button type="button" class="lib-booking__btn-primary"
              [disabled]="!state.canGoNext()" (click)="state.nextStep()">
              Elegir hora →
            </button>
          </div>
        </div>
      }

      <!-- Paso 3: Selección de hora -->
      @if (state.step() === 'time') {
        <div class="lib-booking__section">
          <h2 class="lib-booking__title">¿A qué hora?</h2>
          <p class="lib-booking__subtitle">
            {{ state.selectedService()?.name }} ·
            {{ formatDate(state.selectedDate()!) }}
          </p>
          @if (cargando()) {
            <div class="lib-booking__loading">
              <span class="lib-spinner" style="color:var(--color-accent)"></span>
              Cargando horas disponibles...
            </div>
          } @else {
            <lib-booking-slots
              [slots]="slots()"
              [selected]="state.selectedSlot()"
              (slotSeleccionado)="state.selectSlot($event)"
            />
          }
          <div class="lib-booking__actions">
            <button type="button" class="lib-booking__btn-secondary" (click)="state.prevStep()">← Volver</button>
            <button type="button" class="lib-booking__btn-primary"
              [disabled]="!state.canGoNext()" (click)="state.nextStep()">
              Completar datos →
            </button>
          </div>
        </div>
      }

      <!-- Paso 4: Datos del cliente -->
      @if (state.step() === 'form') {
        <div class="lib-booking__section">
          <h2 class="lib-booking__title">Tus datos</h2>
          <div class="lib-booking__summary-bar">
            📅 {{ formatDate(state.selectedDate()!) }} ·
            🕐 {{ state.selectedSlot()?.label || state.selectedSlot()?.time }} ·
            ✂️ {{ state.selectedService()?.name }}
          </div>
          <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="lib-booking__contact-form" novalidate>
            <div class="lib-booking__form-grid">
              <div class="lib-booking__field">
                <label class="lib-label" for="bk-name">Nombre <span class="lib-required">*</span></label>
                <input id="bk-name" class="lib-input" [class.lib-input--error]="fieldError('name')" type="text" formControlName="name" placeholder="Tu nombre completo" autocomplete="name" />
                @if (fieldError('name')) { <p class="lib-field-error">El nombre es obligatorio</p> }
              </div>
              <div class="lib-booking__field">
                <label class="lib-label" for="bk-email">Email <span class="lib-required">*</span></label>
                <input id="bk-email" class="lib-input" [class.lib-input--error]="fieldError('email')" type="email" formControlName="email" placeholder="tu@email.com" autocomplete="email" />
                @if (fieldError('email')) { <p class="lib-field-error">Email válido requerido</p> }
              </div>
              <div class="lib-booking__field">
                <label class="lib-label" for="bk-phone">Teléfono <span class="lib-required">*</span></label>
                <input id="bk-phone" class="lib-input" [class.lib-input--error]="fieldError('phone')" type="tel" formControlName="phone" placeholder="+34 600 000 000" autocomplete="tel" />
                @if (fieldError('phone')) { <p class="lib-field-error">El teléfono es obligatorio</p> }
              </div>
              <div class="lib-booking__field lib-booking__field--full">
                <label class="lib-label" for="bk-notes">Notas adicionales</label>
                <textarea id="bk-notes" class="lib-input lib-textarea" formControlName="notes" rows="3" placeholder="Cuéntanos algo sobre lo que necesitas..."></textarea>
              </div>
            </div>
            <div class="lib-booking__actions">
              <button type="button" class="lib-booking__btn-secondary" (click)="state.prevStep()">← Volver</button>
              <button type="submit" class="lib-booking__btn-primary" [disabled]="cargando()">
                @if (cargando()) { <span class="lib-spinner lib-spinner--sm lib-spinner--inverse"></span> }
                Confirmar reserva
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Éxito -->
      @if (state.step() === 'success') {
        <div class="lib-booking__success">
          <div class="lib-booking__success-icon">✓</div>
          <h2>¡Reserva confirmada!</h2>
          <p>{{ mensajeExito() }}</p>
          <button type="button" class="lib-booking__btn-primary" (click)="nuevaReserva()">
            Hacer otra reserva
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .lib-booking { width: 100%; }

    /* ── Pasos ── */
    .lib-booking__steps {
      display: flex; margin-bottom: var(--space-8, 2rem); gap: 0;
      overflow-x: auto; padding-bottom: var(--space-2, .5rem);
    }

    .lib-booking__step {
      display: flex; align-items: center; gap: var(--space-2, .5rem);
      font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090);
      flex: 1; position: relative; white-space: nowrap;
    }

    .lib-booking__step::after {
      content: ''; flex: 1; height: 1px;
      background: var(--color-border, #e0e0e0); margin: 0 var(--space-2, .5rem);
    }
    .lib-booking__step:last-child::after { display: none; }

    .lib-booking__step--active { color: var(--color-accent, #ff4d4d); }
    .lib-booking__step--done   { color: var(--color-success, #28a745); }

    .lib-booking__step-dot {
      width: 24px; height: 24px; border-radius: 50%;
      border: 2px solid currentColor;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs, .75rem); font-weight: 700;
      flex-shrink: 0; background: var(--color-background, #fff);
    }
    .lib-booking__step--active .lib-booking__step-dot,
    .lib-booking__step--done   .lib-booking__step-dot { background: currentColor; color: #fff; }

    @media (max-width: 479px) { .lib-booking__step-label { display: none; } }

    /* ── Sección ── */
    .lib-booking__section { animation: lib-fade-in .2s ease both; }
    .lib-booking__title    { font-size: var(--font-size-xl, 1.25rem); font-weight: var(--font-weight-bold, 700); color: var(--color-text, #1a1a1a); margin: 0 0 var(--space-2, .5rem); }
    .lib-booking__subtitle { font-size: var(--font-size-sm, .875rem); color: var(--color-text-secondary, #595959); margin: 0 0 var(--space-6, 1.5rem); }

    /* ── Servicios ── */
    .lib-booking__services { display: flex; flex-direction: column; gap: var(--space-3, .75rem); margin-bottom: var(--space-6, 1.5rem); }

    .lib-booking__service-card {
      display: flex; align-items: center; gap: var(--space-4, 1rem);
      padding: var(--space-4, 1rem);
      border: 2px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-lg, .75rem);
      background: var(--color-background, #fff);
      cursor: pointer; text-align: left; font-family: inherit;
      transition: border-color var(--transition-fast, 120ms ease), background var(--transition-fast, 120ms ease);
    }
    .lib-booking__service-card:hover { border-color: var(--color-accent, #ff4d4d); }
    .lib-booking__service-card--selected {
      border-color: var(--color-accent, #ff4d4d);
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 5%, transparent);
    }

    .lib-booking__service-img {
      width: 64px; height: 64px; object-fit: cover; border-radius: var(--radius-md, .5rem); flex-shrink: 0;
    }

    .lib-booking__service-icon {
      width: 64px; height: 64px; border-radius: var(--radius-md, .5rem);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; color: #fff; flex-shrink: 0;
    }

    .lib-booking__service-name { font-size: var(--font-size-base, 1rem); font-weight: var(--font-weight-semibold, 600); color: var(--color-text, #1a1a1a); margin: 0; }
    .lib-booking__service-desc { font-size: var(--font-size-sm, .875rem); color: var(--color-text-secondary, #595959); margin: var(--space-1, .25rem) 0 0; }
    .lib-booking__service-meta { display: flex; gap: var(--space-4, 1rem); font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); margin-top: var(--space-2, .5rem); }

    /* ── Resumen ── */
    .lib-booking__summary-bar {
      background: var(--color-surface, #f8f9fa);
      border-radius: var(--radius-md, .5rem);
      padding: var(--space-3, .75rem) var(--space-4, 1rem);
      font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-secondary, #595959);
      margin-bottom: var(--space-5, 1.25rem);
    }

    /* ── Formulario ── */
    .lib-booking__form-grid {
      display: grid; grid-template-columns: 1fr; gap: var(--space-4, 1rem);
      margin-bottom: var(--space-6, 1.5rem);
    }
    @media (min-width: 640px) { .lib-booking__form-grid { grid-template-columns: repeat(2, 1fr); } }
    .lib-booking__field        { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-booking__field--full  { grid-column: 1 / -1; }

    /* ── Cargando ── */
    .lib-booking__loading {
      display: flex; align-items: center; gap: var(--space-3, .75rem);
      padding: var(--space-8, 2rem) var(--space-4, 1rem);
      color: var(--color-text-secondary, #595959);
      font-size: var(--font-size-sm, .875rem);
    }

    /* ── Acciones ── */
    .lib-booking__actions { display: flex; gap: var(--space-3, .75rem); justify-content: flex-end; margin-top: var(--space-6, 1.5rem); flex-wrap: wrap; }

    .lib-booking__btn-primary {
      display: inline-flex; align-items: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-6, 1.5rem);
      background: var(--color-accent, #ff4d4d); color: #fff;
      border: none; border-radius: var(--radius-md, .5rem);
      font-size: var(--font-size-base, 1rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; cursor: pointer;
      transition: background var(--transition-fast, 120ms ease);
    }
    .lib-booking__btn-primary:hover:not(:disabled) { background: var(--color-accent-hover, #e63e3e); }
    .lib-booking__btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .lib-booking__btn-secondary {
      padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-md, .5rem);
      background: var(--color-surface, #f8f9fa); color: var(--color-text, #1a1a1a);
      font-size: var(--font-size-base, 1rem); font-family: inherit; cursor: pointer;
    }
    .lib-booking__btn-secondary:hover { background: var(--color-surface-alt, #f1f3f5); }

    /* ── Éxito ── */
    .lib-booking__success {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-4, 1rem);
      padding: var(--space-16, 4rem) var(--space-4, 1rem); text-align: center;
      animation: lib-scale-in .3s ease both;
    }
    .lib-booking__success-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--color-success, #28a745); color: #fff;
      font-size: 1.75rem; display: flex; align-items: center; justify-content: center;
    }
    .lib-booking__success h2 { font-size: var(--font-size-2xl, 1.5rem); font-weight: var(--font-weight-bold, 700); margin: 0; }
    .lib-booking__success p  { color: var(--color-text-secondary, #595959); margin: 0; }
  `],
})
export class BookingFormComponent implements OnInit {
  readonly servicios      = input.required<Service[]>();
  readonly disponibilidad = input<string[]>([]);
  readonly slots          = input<TimeSlot[]>([]);
  readonly cargando       = input(false);
  readonly mensajeExito   = input('Recibirás un email de confirmación en breve.');

  readonly reservaConfirmada    = output<BookingRequest>();
  readonly servicioSeleccionado = output<Service>();
  readonly fechaSeleccionada    = output<string>();

  readonly state = inject(BookingStateService);

  readonly stepList = [
    { id: 'service' as BookingStep, num: 1, label: STEP_LABELS.service },
    { id: 'date'    as BookingStep, num: 2, label: STEP_LABELS.date },
    { id: 'time'    as BookingStep, num: 3, label: STEP_LABELS.time },
    { id: 'form'    as BookingStep, num: 4, label: STEP_LABELS.form },
  ];

  contactForm = inject(FormBuilder).group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void { this.state.reset(); }

  isStepDone(id: BookingStep): boolean {
    const order: BookingStep[] = ['service', 'date', 'time', 'form', 'success'];
    return order.indexOf(this.state.step()) > order.indexOf(id);
  }

  selectService(s: Service): void {
    this.state.selectService(s);
    this.servicioSeleccionado.emit(s);
  }

  selectDate(date: string): void {
    this.state.selectDate(date);
    this.fechaSeleccionada.emit(date);
  }

  onSubmit(): void {
    if (this.contactForm.invalid) { this.contactForm.markAllAsTouched(); return; }
    const v = this.contactForm.getRawValue();
    const s = this.state.selectedService()!;
    const req: BookingRequest = {
      serviceId:   s.id,
      serviceName: s.name,
      date:        this.state.selectedDate()!,
      time:        this.state.selectedSlot()!.time,
      clientName:  v.name!,
      clientEmail: v.email!,
      clientPhone: v.phone!,
      notes:       v.notes || undefined,
    };
    this.reservaConfirmada.emit(req);
    this.state.nextStep();
  }

  nuevaReserva(): void { this.state.reset(); }

  fieldError(field: string): boolean {
    const c = this.contactForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p);
  }

  formatDate(iso: string): string {
    return new Date(iso + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
