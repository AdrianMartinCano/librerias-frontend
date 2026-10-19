import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReservationsSettings, TimeRange } from '@org/models';
import { ReservationsSettingsService } from './reservations-settings.service';

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'error';

interface DayOption { value: string; label: string; }

const DAYS: DayOption[] = [
  { value: 'MONDAY',    label: 'Lunes' },
  { value: 'TUESDAY',   label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY',  label: 'Jueves' },
  { value: 'FRIDAY',    label: 'Viernes' },
  { value: 'SATURDAY',  label: 'Sábado' },
  { value: 'SUNDAY',    label: 'Domingo' },
];

/**
 * Formulario de ajustes de reservas: horario **por día con turnos partidos** (cada día, cero o
 * varios tramos; sin tramos = cerrado), intervalo de slots, capacidad y **vacaciones** (días
 * cerrados). Carga del backend al iniciar y guarda los cambios (`/api/admin/reservations/settings`).
 */
@Component({
  selector: 'lib-reservations-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="rs" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h3 class="rs__title">Ajustes de reservas</h3>

      @if (status() === 'loading') {
        <p class="rs__muted">Cargando ajustes…</p>
      } @else {
        <!-- ── Horario semanal ── -->
        <section class="rs__sec">
          <h4 class="rs__sec-title">Horario semanal</h4>
          <p class="rs__muted">Activa cada día y añade sus tramos (varios = turno partido).</p>
          <div class="rs__week">
            @for (d of days; track d.value) {
              <div class="rs__day" [class.rs__day--open]="isOpen(d.value)">
                <label class="rs__day-toggle">
                  <input type="checkbox" [checked]="isOpen(d.value)"
                         (change)="setDayOpen(d.value, $event)"
                         [attr.aria-label]="d.label + (isOpen(d.value) ? ' abierto' : ' cerrado')" />
                  <span class="rs__day-name">{{ d.label }}</span>
                </label>

                @if (isOpen(d.value)) {
                  <div class="rs__ranges">
                    @for (r of rangesOf(d.value); track $index) {
                      <span class="rs__range">
                        <input class="lib-input rs__time" type="time" [value]="r.start"
                               [attr.aria-label]="d.label + ' inicio tramo ' + ($index + 1)"
                               (change)="setRange(d.value, $index, 'start', $event)" />
                        <span class="rs__dash">–</span>
                        <input class="lib-input rs__time" type="time" [value]="r.end"
                               [attr.aria-label]="d.label + ' fin tramo ' + ($index + 1)"
                               (change)="setRange(d.value, $index, 'end', $event)" />
                        <button type="button" class="rs__x" (click)="removeRange(d.value, $index)"
                                [attr.aria-label]="'Quitar tramo de ' + d.label">×</button>
                      </span>
                    }
                    <button type="button" class="rs__add" (click)="addRange(d.value)">+ tramo</button>
                  </div>
                } @else {
                  <span class="rs__closed">Cerrado</span>
                }
              </div>
            }
          </div>
        </section>

        <!-- ── Reservas ── -->
        <section class="rs__sec">
          <h4 class="rs__sec-title">Reservas</h4>
          <div class="rs__row">
            <div class="rs__field">
              <label class="lib-label" for="rs-interval">Tiempo entre clientes (min)</label>
              <input id="rs-interval" class="lib-input" type="number" min="5" step="5" formControlName="slotIntervalMinutes" />
            </div>
            <div class="rs__field">
              <label class="lib-label" for="rs-capacity">Citas en paralelo</label>
              <input id="rs-capacity" class="lib-input" type="number" min="1" step="1" formControlName="capacity" />
            </div>
          </div>
        </section>

        <!-- ── Vacaciones ── -->
        <section class="rs__sec">
          <h4 class="rs__sec-title" id="rs-vac-label">Vacaciones / días cerrados</h4>
          <p class="rs__muted">Elige un día, o un rango (Desde–Hasta) para cerrar varios de una vez.</p>
          <div class="rs__vac-add">
            <label class="rs__vac-fld">Desde
              <input class="lib-input" type="date" [min]="today" #vacFrom />
            </label>
            <label class="rs__vac-fld">Hasta <span class="rs__opt">(opcional)</span>
              <input class="lib-input" type="date" [min]="vacFrom.value || today" #vacTo />
            </label>
            <button type="button" class="rs__add"
                    (click)="addBlockedRange(vacFrom.value, vacTo.value); vacFrom.value=''; vacTo.value=''">Añadir</button>
          </div>
          @if (blockedDates().length === 0) {
            <p class="rs__muted">Sin días cerrados. Añade fechas de vacaciones o festivos.</p>
          } @else {
            <ul class="rs__vac-list">
              @for (d of blockedDates(); track d) {
                <li class="rs__vac">
                  {{ d }}
                  <button type="button" class="rs__x" (click)="removeBlocked(d)" [attr.aria-label]="'Quitar ' + d">×</button>
                </li>
              }
            </ul>
          }
        </section>

        @if (status() === 'error') { <p class="rs__error" role="alert">{{ errorMsg() }}</p> }
        @if (status() === 'saved') { <p class="rs__ok" role="status">Ajustes guardados.</p> }

        <button type="submit" class="rs__btn" [disabled]="form.invalid || status() === 'saving'">
          {{ status() === 'saving' ? 'Guardando…' : 'Guardar ajustes' }}
        </button>
      }
    </form>
  `,
  styles: [`
    .rs { display: flex; flex-direction: column; gap: var(--space-4, 1rem); max-width: 620px;
      background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem); padding: var(--space-5, 1.25rem); }
    .rs__title { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .rs__muted { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .rs__row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3, .75rem); }
    .rs__field { display: flex; flex-direction: column; gap: var(--space-1, .35rem); }

    /* Secciones */
    .rs__sec { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .rs__sec-title { font-size: var(--font-size-xs, .75rem); font-weight: var(--font-weight-semibold, 600);
      text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted, #909090);
      padding-bottom: var(--space-1, .35rem); border-bottom: 1px solid var(--color-border, #e2e2e2); }

    /* Horario: una fila por día con toggle Abierto/Cerrado + tramos en línea */
    .rs__week { display: flex; flex-direction: column; gap: var(--space-1, .35rem); }
    .rs__day { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2, .5rem) var(--space-3, .75rem);
      padding: var(--space-2, .5rem) 0; border-bottom: 1px solid var(--color-surface-alt, #f0f0f0); }
    .rs__day-toggle { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; min-width: 120px; }
    .rs__day-toggle input { accent-color: var(--color-accent, #ff4d4d); width: 16px; height: 16px; }
    .rs__day-name { font-weight: var(--font-weight-semibold, 600); }
    .rs__day:not(.rs__day--open) .rs__day-name { color: var(--color-text-muted, #909090); font-weight: var(--font-weight-medium, 500); }
    .rs__closed { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .rs__ranges { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2, .5rem); }
    .rs__add { padding: .3rem .7rem; border: 1px solid var(--color-border, #e2e2e2);
      background: var(--color-surface, #f8f9fa); border-radius: var(--radius-md, .5rem);
      font-family: inherit; font-size: var(--font-size-sm, .875rem); cursor: pointer; white-space: nowrap; }
    .rs__range { display: inline-flex; align-items: center; gap: .35rem; }
    .rs__time { width: auto; padding: .3rem .4rem; }
    .rs__dash { color: var(--color-text-muted, #909090); }
    .rs__x { border: none; background: none; cursor: pointer; font-size: 1.2rem; line-height: 1;
      color: var(--color-text-muted, #909090); padding: 0 .2rem; }
    .rs__x:hover { color: var(--color-danger, #dc3545); }
    .rs__vac-add { display: flex; gap: var(--space-3, .75rem); align-items: flex-end; flex-wrap: wrap; }
    .rs__vac-fld { display: flex; flex-direction: column; gap: .25rem;
      font-size: var(--font-size-sm, .875rem); color: var(--color-text, #1a1a1a); }
    .rs__opt { color: var(--color-text-muted, #909090); font-weight: var(--font-weight-normal, 400); }
    .rs__vac-list { display: flex; flex-wrap: wrap; gap: var(--space-2, .5rem); margin-top: .25rem; }
    .rs__vac { display: inline-flex; align-items: center; gap: .3rem; font-variant-numeric: tabular-nums;
      padding: .3rem .6rem; border: 1px solid var(--color-border, #e2e2e2); border-radius: 999px;
      font-size: var(--font-size-sm, .875rem); }
    .rs__btn { align-self: flex-start; padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      background: var(--color-accent, #ff4d4d); color: #fff; border: none;
      border-radius: var(--radius-md, .5rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; cursor: pointer; }
    .rs__btn:disabled { opacity: .5; cursor: not-allowed; }
    .rs__add:focus-visible, .rs__btn:focus-visible, .rs__x:focus-visible {
      outline: 2px solid var(--color-accent, #ff4d4d); outline-offset: 2px; }
    .rs__error { color: var(--color-danger, #dc3545); font-size: var(--font-size-sm, .875rem); }
    .rs__ok { color: var(--color-success, #28a745); font-size: var(--font-size-sm, .875rem); }
  `],
})
export class ReservationsSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReservationsSettingsService);

  readonly days = DAYS;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly status = signal<Status>('loading');
  readonly errorMsg = signal('');
  readonly weekly = signal<Record<string, TimeRange[]>>({});
  readonly blockedDates = signal<string[]>([]);

  readonly form = this.fb.group({
    slotIntervalMinutes: [30, [Validators.required, Validators.min(5)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.api.get().subscribe({
      next: (res) => {
        if (res.data) this.patch(res.data);
        this.status.set('ready');
      },
      error: () => { this.status.set('error'); this.errorMsg.set('No se pudieron cargar los ajustes.'); },
    });
  }

  rangesOf(day: string): TimeRange[] {
    return this.weekly()[day] ?? [];
  }

  isOpen(day: string): boolean {
    return this.rangesOf(day).length > 0;
  }

  /** Toggle Abierto/Cerrado: al abrir crea un tramo por defecto; al cerrar elimina los tramos del día. */
  setDayOpen(day: string, event: Event): void {
    const open = (event.target as HTMLInputElement).checked;
    if (open) {
      if (this.rangesOf(day).length === 0) this.addRange(day);
    } else {
      this.weekly.update((w) => {
        const next = { ...w };
        delete next[day];
        return next;
      });
    }
  }

  addRange(day: string): void {
    this.weekly.update((w) => {
      const next = { ...w };
      next[day] = [...(next[day] ?? []), { start: '09:00', end: '13:00' }];
      return next;
    });
  }

  removeRange(day: string, index: number): void {
    this.weekly.update((w) => {
      const next = { ...w };
      const list = (next[day] ?? []).filter((_, i) => i !== index);
      if (list.length) { next[day] = list; } else { delete next[day]; }
      return next;
    });
  }

  setRange(day: string, index: number, field: 'start' | 'end', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.weekly.update((w) => {
      const next = { ...w };
      const list = [...(next[day] ?? [])];
      list[index] = { ...list[index], [field]: value };
      next[day] = list;
      return next;
    });
  }

  /** Añade un día o un rango completo (Desde–Hasta, ambos inclusive). Sin "Hasta" añade solo "Desde". */
  addBlockedRange(from: string, to: string): void {
    if (!from) return;
    const end = to && to >= from ? to : from;
    const dates: string[] = [];
    let cur = from;
    let guard = 0;
    while (cur <= end && guard++ < 730) {   // tope de 2 años por seguridad
      dates.push(cur);
      cur = this.nextDay(cur);
    }
    this.blockedDates.update((list) => [...new Set([...list, ...dates])].sort());
  }

  removeBlocked(date: string): void {
    this.blockedDates.update((list) => list.filter((d) => d !== date));
  }

  /** Siguiente día en ISO 'YYYY-MM-DD' (en UTC para evitar saltos por horario de verano). */
  private nextDay(iso: string): string {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // Validación cliente: en cada tramo, fin posterior al inicio.
    for (const [day, ranges] of Object.entries(this.weekly())) {
      for (const r of ranges) {
        if (r.start >= r.end) {
          this.status.set('error');
          this.errorMsg.set(`Tramo inválido (${r.start}–${r.end}): el fin debe ser posterior al inicio.`);
          return;
        }
      }
    }

    const v = this.form.getRawValue();
    const settings: ReservationsSettings = {
      weeklyHours: this.weekly(),
      slotIntervalMinutes: v.slotIntervalMinutes ?? 30,
      capacity: v.capacity ?? 1,
      blockedDates: this.blockedDates(),
    };

    this.status.set('saving');
    this.api.update(settings).subscribe({
      next: () => this.status.set('saved'),
      error: () => { this.status.set('error'); this.errorMsg.set('No se pudieron guardar los ajustes.'); },
    });
  }

  private patch(s: ReservationsSettings): void {
    this.form.patchValue({ slotIntervalMinutes: s.slotIntervalMinutes, capacity: s.capacity });
    this.weekly.set({ ...(s.weeklyHours ?? {}) });
    this.blockedDates.set([...(s.blockedDates ?? [])].sort());
  }
}
