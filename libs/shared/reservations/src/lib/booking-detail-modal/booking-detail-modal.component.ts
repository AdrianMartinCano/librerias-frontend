import { Component, ChangeDetectionStrategy, input, output, inject, computed, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService as Service, BookingRequest, Staff } from '@org/models';

/**
 * Modal reutilizable de detalle de una cita con <b>edición completa</b> (servicio, profesional,
 * fecha/hora, duración y datos del cliente) y <b>cancelación</b>. Valida solapes por trabajador igual
 * que el panel de alta.
 *
 * <p>Controlado: se muestra cuando {@code booking} no es nulo. Emite {@code save} con la cita editada,
 * {@code cancelBooking} para anularla y {@code close} para cerrar sin cambios. El host aplica los
 * cambios sobre su array (usando {@code editingIndex}) y llama al backend.</p>
 */
@Component({
  selector: 'lib-booking-detail-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (booking(); as b) {
      <div class="lib-bdm-ov" role="button" tabindex="0" aria-label="Cerrar"
           (click)="closed.emit()" (keydown.escape)="closed.emit()">
        <div class="lib-bdm" role="dialog" aria-modal="true" aria-labelledby="bdm-title"
             (click)="$event.stopPropagation()" (keydown.escape)="closed.emit()" tabindex="-1">
          <header class="lib-bdm__head">
            <h3 class="lib-bdm__title" id="bdm-title">Detalle de la cita</h3>
            <button type="button" class="lib-bdm__x" (click)="closed.emit()" aria-label="Cerrar">✕</button>
          </header>

          <form class="lib-bdm__body" [formGroup]="form" (ngSubmit)="onSave()" novalidate>
            @if (readonly()) {
              <p class="lib-bdm__ro">🔒 Cita pasada — solo lectura.</p>
            }
            <div class="lib-bdm__grid">
              @if (profesionales().length) {
                <div class="lib-field">
                  <label class="lib-label" for="bdm-staff">Profesional <span class="lib-required">*</span></label>
                  <select id="bdm-staff" class="lib-input lib-select" formControlName="staffId">
                    @for (p of profesionales(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
                  </select>
                </div>
              }
              <div class="lib-field">
                <label class="lib-label" for="bdm-service">Servicio <span class="lib-required">*</span></label>
                <select id="bdm-service" class="lib-input lib-select" formControlName="serviceId">
                  @for (s of services(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                </select>
              </div>
              <div class="lib-field">
                <label class="lib-label" for="bdm-date">Fecha <span class="lib-required">*</span></label>
                <input id="bdm-date" class="lib-input" type="date" formControlName="date" />
              </div>
              <div class="lib-field">
                <label class="lib-label" for="bdm-time">Hora inicio <span class="lib-required">*</span></label>
                <input id="bdm-time" class="lib-input" type="time" formControlName="time" />
              </div>
              <div class="lib-field">
                <label class="lib-label" for="bdm-dur">Duración (min) <span class="lib-required">*</span></label>
                <input id="bdm-dur" class="lib-input" type="number" min="5" step="5" formControlName="durationMinutes" />
              </div>
              @if (timeRange()) { <p class="lib-bdm__range">🕒 {{ timeRange() }}</p> }

              <p class="lib-bdm__section">Datos del cliente</p>
              <div class="lib-field">
                <label class="lib-label" for="bdm-name">Nombre <span class="lib-required">*</span></label>
                <input id="bdm-name" class="lib-input" type="text" formControlName="clientName" />
              </div>
              <div class="lib-field">
                <label class="lib-label" for="bdm-email">Email <span class="lib-required">*</span></label>
                <input id="bdm-email" class="lib-input" type="email" formControlName="clientEmail" />
              </div>
              <div class="lib-field">
                <label class="lib-label" for="bdm-phone">Teléfono <span class="lib-required">*</span></label>
                <input id="bdm-phone" class="lib-input" type="tel" formControlName="clientPhone" />
              </div>
              <div class="lib-field lib-field--full">
                <label class="lib-label" for="bdm-notes">Notas</label>
                <textarea id="bdm-notes" class="lib-input lib-textarea" formControlName="notes" rows="2"></textarea>
              </div>
            </div>

            @if (errorMsg()) { <p class="lib-bdm__alert" role="alert">⚠️ {{ errorMsg() }}</p> }

            <footer class="lib-bdm__actions">
              @if (!readonly()) {
                <button type="button" class="lib-bdm__btn lib-bdm__btn--danger" (click)="cancelBooking.emit()">
                  Cancelar cita
                </button>
              }
              <span class="lib-bdm__spacer"></span>
              <button type="button" class="lib-bdm__btn lib-bdm__btn--ghost" (click)="closed.emit()">Cerrar</button>
              @if (!readonly()) {
                <button type="submit" class="lib-bdm__btn" [disabled]="form.invalid || loading()">
                  @if (loading()) { <span class="lib-spinner lib-spinner--sm lib-spinner--inverse"></span> }
                  Guardar cambios
                </button>
              }
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .lib-bdm-ov {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center;
      padding: var(--space-4, 1rem); animation: lib-fade-in .15s ease both;
    }
    .lib-bdm {
      width: 100%; max-width: 560px; max-height: 90vh; overflow: auto;
      background: var(--color-background, #fff);
      border-radius: var(--radius-lg, .75rem);
      box-shadow: var(--shadow-lg, 0 10px 40px rgba(0,0,0,.25));
      animation: lib-scale-in .18s ease both;
    }
    .lib-bdm__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      border-bottom: 1px solid var(--color-border, #e2e2e2);
      position: sticky; top: 0; background: var(--color-background, #fff);
    }
    .lib-bdm__title { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .lib-bdm__x {
      width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-md, .5rem); font-size: 1rem; color: var(--color-text-muted, #909090);
    }
    .lib-bdm__x:hover { background: var(--color-surface, #f8f9fa); }

    .lib-bdm__body { padding: var(--space-5, 1.25rem); }
    .lib-bdm__ro {
      margin: 0 0 var(--space-3, .75rem); font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-muted, #909090);
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e2e2e2);
      padding: var(--space-2, .5rem) var(--space-3, .75rem); border-radius: var(--radius-md, .5rem);
    }
    .lib-bdm__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-3, .75rem) var(--space-4, 1rem); }
    .lib-field { display: flex; flex-direction: column; gap: var(--space-1, .35rem); min-width: 0; }
    .lib-field--full { grid-column: 1 / -1; }
    .lib-bdm__section {
      grid-column: 1 / -1; font-size: var(--font-size-xs, .75rem); font-weight: var(--font-weight-semibold, 600);
      text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted, #909090);
      margin-top: var(--space-2, .5rem); padding-bottom: var(--space-1, .35rem);
      border-bottom: 1px solid var(--color-border, #e2e2e2);
    }
    .lib-bdm__range {
      grid-column: 1 / -1; font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-medium, 500);
      color: var(--color-accent, #ff4d4d);
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 10%, transparent);
      padding: var(--space-2, .5rem) var(--space-3, .75rem); border-radius: var(--radius-md, .5rem); margin: 0;
    }
    .lib-bdm__alert {
      margin-top: var(--space-3, .75rem); font-size: var(--font-size-sm, .875rem); color: var(--color-danger, #dc3545);
      background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger, #dc3545) 35%, transparent);
      padding: var(--space-2, .5rem) var(--space-3, .75rem); border-radius: var(--radius-md, .5rem);
    }
    .lib-bdm__actions {
      display: flex; align-items: center; gap: var(--space-3, .75rem);
      margin-top: var(--space-5, 1.25rem); padding-top: var(--space-4, 1rem);
      border-top: 1px solid var(--color-border, #e2e2e2);
    }
    .lib-bdm__spacer { flex: 1; }
    .lib-bdm__btn {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      background: var(--color-accent, #ff4d4d); color: #fff; border: none;
      border-radius: var(--radius-md, .5rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; font-size: var(--font-size-base, 1rem); cursor: pointer;
    }
    .lib-bdm__btn:disabled { opacity: .5; cursor: not-allowed; }
    .lib-bdm__btn--ghost { background: transparent; color: var(--color-text-muted, #909090); border: 1px solid var(--color-border, #e2e2e2); }
    .lib-bdm__btn--danger { background: transparent; color: var(--color-danger, #dc3545); border: 1px solid color-mix(in srgb, var(--color-danger, #dc3545) 45%, transparent); }
    .lib-bdm__btn--danger:hover { background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, transparent); }
  `],
})
export class BookingDetailModalComponent {
  readonly booking       = input<BookingRequest | null>(null);
  /** Posición de la cita en el array del host (para excluirla del solape). */
  readonly editingIndex  = input<number | null>(null);
  readonly services      = input<Service[]>([]);
  readonly profesionales = input<Staff[]>([]);
  /** Reservas del host, para validar solape por trabajador. */
  readonly bookings      = input<BookingRequest[]>([]);
  readonly loading       = input(false);
  /** Solo lectura (p. ej. cita pasada): no se puede editar ni cancelar. */
  readonly readonly      = input(false);

  readonly save          = output<BookingRequest>();
  readonly cancelBooking = output<void>();
  readonly closed        = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    staffId:     [''],
    serviceId:   ['', Validators.required],
    date:        ['', Validators.required],
    time:        ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(5)]],
    clientName:  ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.required],
    notes:       [''],
  });

  readonly errorMsg = signal<string | null>(null);

  private readonly servicesById = computed(() => new Map(this.services().map((s) => [s.id, s])));
  private readonly staffById    = computed(() => new Map(this.profesionales().map((p) => [p.id, p])));

  // Espejos reactivos para el rango horario (los signals no leen valueChanges directamente).
  private readonly formTime     = signal('');
  private readonly formDuration = signal(0);

  readonly timeRange = computed(() => {
    const time = this.formTime(); const min = this.formDuration();
    if (!time || !min || min <= 0) return '';
    return `${time} – ${this.addMinutes(time, min)}`;
  });

  constructor() {
    this.form.controls.time.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.formTime.set(v ?? ''));
    this.form.controls.durationMinutes.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.formDuration.set(v ?? 0));

    // Prefija el formulario cada vez que cambia la cita seleccionada.
    effect(() => {
      const b = this.booking();
      if (!b) return;
      const dur = b.durationMinutes ?? this.servicesById().get(b.serviceId)?.durationMinutes ?? 60;
      this.form.reset({
        staffId: b.staffId ?? '', serviceId: b.serviceId, date: b.date, time: b.time,
        durationMinutes: dur, clientName: b.clientName, clientEmail: b.clientEmail,
        clientPhone: b.clientPhone, notes: b.notes ?? '',
      });
      // Solo lectura → campos deshabilitados; editable → habilitados.
      if (this.readonly()) this.form.disable({ emitEvent: false });
      else                 this.form.enable({ emitEvent: false });
      this.errorMsg.set(null);
    });
  }

  onSave(): void {
    if (this.readonly()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const staffId = v.staffId || undefined;
    if (this.profesionales().length && !staffId) { this.errorMsg.set('Elige un profesional.'); return; }

    const durationMinutes = v.durationMinutes ?? 60;
    const date = v.date ?? '';
    const start = v.time ?? '';
    const end = this.addMinutes(start, durationMinutes);

    if (this.hasOverlap(date, start, end, this.editingIndex(), staffId)) {
      this.errorMsg.set('Se solapa con otra cita de ese profesional. Elige otra hora.');
      return;
    }
    this.errorMsg.set(null);

    const svc = this.servicesById().get(v.serviceId ?? '');
    const staff = staffId ? this.staffById().get(staffId) : undefined;
    this.save.emit({
      serviceId:   v.serviceId ?? '',
      serviceName: svc?.name ?? this.booking()?.serviceName ?? '',
      date, time: start,
      clientName:  v.clientName ?? '',
      clientEmail: v.clientEmail ?? '',
      clientPhone: v.clientPhone ?? '',
      notes:       v.notes || undefined,
      durationMinutes,
      staffId, staffName: staff?.name, staffColor: staff?.color,
    });
  }

  private hasOverlap(date: string, start: string, end: string, exceptIndex: number | null, staffId?: string): boolean {
    const s = this.toMin(start), e = this.toMin(end);
    return this.bookings().some((b, i) => {
      if (i === exceptIndex) return false;
      if (b.date !== date) return false;
      if (staffId && b.staffId !== staffId) return false;
      const bs = this.toMin(b.time);
      const be = bs + (b.durationMinutes ?? this.servicesById().get(b.serviceId)?.durationMinutes ?? 60);
      return s < be && bs < e;
    });
  }

  private toMin(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  private addMinutes(t: string, min: number): string {
    const total = this.toMin(t) + min;
    return `${String(Math.floor((total % 1440) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
}
