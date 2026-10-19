import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SaveSeatingRequest, Seating, WeekDay } from '@org/models';

const DAYS: { value: WeekDay; label: string }[] = [
  { value: 'MONDAY', label: 'L' }, { value: 'TUESDAY', label: 'M' }, { value: 'WEDNESDAY', label: 'X' },
  { value: 'THURSDAY', label: 'J' }, { value: 'FRIDAY', label: 'V' }, { value: 'SATURDAY', label: 'S' },
  { value: 'SUNDAY', label: 'D' },
];

/**
 * CRUD de turnos de servicio (Comida 13–15, Cena 20–22…). `durationMinutes` es lo que ocupa la mesa.
 * Los días en los que aplica se eligen con los toggles. Componente controlado.
 */
@Component({
  selector: 'lib-seatings-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-sa">
      <div class="lib-sa__list">
        <h4 class="lib-sa__list-title">Turnos · {{ seatings().length }}</h4>
        @if (seatings().length === 0) {
          <p class="lib-sa__empty">Aún no hay turnos. Crea el primero.</p>
        } @else {
          <ul class="lib-sa__items">
            @for (s of seatings(); track s.id) {
              <li class="lib-sa__item" [class.lib-sa__item--off]="!s.active" [class.lib-sa__item--active]="editingId() === s.id">
                <span class="lib-sa__info">
                  <strong>{{ s.name }}</strong>
                  <small>{{ s.start }}–{{ s.end }} · {{ s.durationMinutes }} min · {{ daysLabel(s.daysOfWeek) }}{{ s.active ? '' : ' · inactivo' }}</small>
                </span>
                <span class="lib-sa__acts">
                  <button type="button" class="lib-sa__icon" (click)="edit(s)" title="Editar">✏️</button>
                  <button type="button" class="lib-sa__icon" (click)="toggled.emit(s.id)" title="Activar/desactivar">{{ s.active ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-sa__icon lib-sa__icon--danger" (click)="deleted.emit(s.id)" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <form class="lib-sa__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-sa__head">
          <h3 class="lib-sa__title">{{ editingId() ? 'Editar turno' : 'Nuevo turno' }}</h3>
          @if (editingId()) { <button type="button" class="lib-sa__chip" (click)="reset()">Nuevo</button> }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="s-name">Nombre <span class="lib-required">*</span></label>
          <input id="s-name" class="lib-input" type="text" formControlName="name" placeholder="Cena" />
        </div>

        <div class="lib-sa__row">
          <div class="lib-field lib-sa__grow">
            <label class="lib-label" for="s-start">Inicio <span class="lib-required">*</span></label>
            <input id="s-start" class="lib-input" type="time" formControlName="start" />
          </div>
          <div class="lib-field lib-sa__grow">
            <label class="lib-label" for="s-end">Fin <span class="lib-required">*</span></label>
            <input id="s-end" class="lib-input" type="time" formControlName="end" />
          </div>
          <div class="lib-field lib-sa__grow">
            <label class="lib-label" for="s-dur">Duración (min) <span class="lib-required">*</span></label>
            <input id="s-dur" class="lib-input" type="number" min="15" step="15" formControlName="durationMinutes" />
          </div>
        </div>

        <div class="lib-field">
          <span class="lib-label">Días</span>
          <div class="lib-sa__days">
            @for (d of days; track d.value) {
              <button type="button" class="lib-sa__day" [class.lib-sa__day--on]="selectedDays().includes(d.value)" (click)="toggleDay(d.value)">{{ d.label }}</button>
            }
          </div>
        </div>

        <button type="submit" class="lib-sa__btn" [disabled]="form.invalid || selectedDays().length === 0 || loading()">
          {{ editingId() ? 'Guardar cambios' : 'Crear turno' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .lib-sa { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 860px) { .lib-sa { grid-template-columns: 1fr minmax(300px, .9fr); align-items: start; } }
    .lib-sa__list, .lib-sa__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-sa__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-sa__list-title { font-size: var(--font-size-sm, .875rem); font-weight: 600; margin-bottom: var(--space-3, .75rem); }
    .lib-sa__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-sa__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-sa__item { display: flex; align-items: center; gap: var(--space-3, .75rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-sa__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-sa__item--off { opacity: .55; }
    .lib-sa__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-sa__info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-sa__info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-sa__acts { display: flex; gap: .35rem; }
    .lib-sa__icon { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-sa__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-sa__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-sa__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-sa__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }
    .lib-sa__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-sa__grow { flex: 1; }
    .lib-sa__days { display: flex; gap: .35rem; }
    .lib-sa__day { width: 34px; height: 34px; border-radius: var(--radius-md, .5rem); border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff); cursor: pointer; font-weight: 600; color: var(--color-text, #1a1a1a); }
    .lib-sa__day--on { background: var(--color-accent, #ff4d4d); border-color: var(--color-accent, #ff4d4d); color: #fff; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-sa__btn { padding: var(--space-3, .75rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-sa__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class SeatingsAdminComponent {
  readonly seatings = input<Seating[]>([]);
  readonly loading  = input(false);

  readonly created = output<SaveSeatingRequest>();
  readonly updated = output<{ id: string; payload: SaveSeatingRequest }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly days = DAYS;
  readonly editingId = signal<string | null>(null);
  readonly selectedDays = signal<WeekDay[]>([]);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:            ['', Validators.required],
    start:           ['', Validators.required],
    end:             ['', Validators.required],
    durationMinutes: [90, [Validators.required, Validators.min(15)]],
    sortOrder:       [0, Validators.min(0)],
  });

  daysLabel(days: WeekDay[]): string {
    return this.days.filter(d => days.includes(d.value)).map(d => d.label).join('');
  }

  toggleDay(d: WeekDay): void {
    const set = new Set(this.selectedDays());
    if (set.has(d)) set.delete(d); else set.add(d);
    this.selectedDays.set(this.days.map(x => x.value).filter(v => set.has(v)));
  }

  edit(s: Seating): void {
    this.editingId.set(s.id);
    this.selectedDays.set([...s.daysOfWeek]);
    this.form.reset({ name: s.name, start: s.start, end: s.end, durationMinutes: s.durationMinutes, sortOrder: s.sortOrder });
  }

  reset(): void {
    this.editingId.set(null);
    this.selectedDays.set([]);
    this.form.reset({ name: '', start: '', end: '', durationMinutes: 90, sortOrder: 0 });
  }

  submit(): void {
    if (this.form.invalid || this.selectedDays().length === 0) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: SaveSeatingRequest = {
      name:            v.name ?? '',
      start:           v.start ?? '',
      end:             v.end ?? '',
      durationMinutes: v.durationMinutes ?? 90,
      sortOrder:       v.sortOrder ?? 0,
      daysOfWeek:      this.selectedDays(),
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
