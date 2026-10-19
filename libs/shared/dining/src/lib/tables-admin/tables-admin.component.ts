import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DiningTable, SaveTableRequest, Zone } from '@org/models';

/**
 * CRUD de mesas. La capacidad va en comensales (min/max) y `combinable` permite juntarla con otras de
 * su zona. Componente controlado: necesita `zones` para el selector y emite los cambios al host.
 */
@Component({
  selector: 'lib-tables-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-ta">
      <div class="lib-ta__list">
        <h4 class="lib-ta__list-title">Mesas · {{ tables().length }}</h4>
        @if (tables().length === 0) {
          <p class="lib-ta__empty">Aún no hay mesas. Crea la primera.</p>
        } @else {
          <ul class="lib-ta__items">
            @for (t of tables(); track t.id) {
              <li class="lib-ta__item" [class.lib-ta__item--off]="!t.active" [class.lib-ta__item--active]="editingId() === t.id">
                <span class="lib-ta__info">
                  <strong>{{ t.label }}</strong>
                  <small>{{ t.zoneName }} · {{ t.capacityMin }}–{{ t.capacityMax }} personas{{ t.combinable ? ' · combinable' : '' }}{{ t.active ? '' : ' · inactiva' }}</small>
                </span>
                <span class="lib-ta__acts">
                  <button type="button" class="lib-ta__icon" (click)="edit(t)" title="Editar">✏️</button>
                  <button type="button" class="lib-ta__icon" (click)="toggled.emit(t.id)" title="Activar/desactivar">{{ t.active ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-ta__icon lib-ta__icon--danger" (click)="deleted.emit(t.id)" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <form class="lib-ta__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-ta__head">
          <h3 class="lib-ta__title">{{ editingId() ? 'Editar mesa' : 'Nueva mesa' }}</h3>
          @if (editingId()) { <button type="button" class="lib-ta__chip" (click)="reset()">Nueva</button> }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="t-label">Nombre <span class="lib-required">*</span></label>
          <input id="t-label" class="lib-input" type="text" formControlName="label" placeholder="Mesa 4" />
        </div>

        <div class="lib-field">
          <label class="lib-label" for="t-zone">Zona <span class="lib-required">*</span></label>
          <select id="t-zone" class="lib-input" formControlName="zoneId">
            <option value="">— elige zona —</option>
            @for (z of zones(); track z.id) { <option [value]="z.id">{{ z.name }}</option> }
          </select>
        </div>

        <div class="lib-ta__row">
          <div class="lib-field lib-ta__grow">
            <label class="lib-label" for="t-min">Personas mínimas <span class="lib-required">*</span></label>
            <input id="t-min" class="lib-input" type="number" min="1" formControlName="capacityMin"
                   title="Grupo mínimo razonable para esta mesa: evita sentar grupos pequeños en mesas grandes. Pon 1 si no quieres mínimo." />
          </div>
          <div class="lib-field lib-ta__grow">
            <label class="lib-label" for="t-max">Personas máximas <span class="lib-required">*</span></label>
            <input id="t-max" class="lib-input" type="number" min="1" formControlName="capacityMax"
                   title="Cuántos comensales caben como máximo en la mesa." />
          </div>
          <div class="lib-field lib-ta__grow">
            <label class="lib-label" for="t-order">Orden</label>
            <input id="t-order" class="lib-input" type="number" min="0" formControlName="sortOrder" />
          </div>
        </div>
        <p class="lib-ta__hint">
          Capacidad en comensales. Al reservar se elige la mesa más ajustada cuyo rango cubra al grupo;
          si solo quedan mesas grandes, también se usan. Pon <strong>personas mínimas = 1</strong> para no fijar mínimo.
        </p>

        <label class="lib-ta__chk">
          <input type="checkbox" formControlName="combinable" />
          Combinable con otras mesas de su zona
        </label>
        <p class="lib-ta__hint">
          Para grupos grandes que no caben en una sola mesa, el sistema <strong>une</strong> mesas
          combinables de la misma zona (p. ej. dos mesas de 4 para un grupo de 6). Si no la marcas,
          esta mesa nunca se junta con otra.
        </p>

        <button type="submit" class="lib-ta__btn" [disabled]="form.invalid || loading()">
          {{ editingId() ? 'Guardar cambios' : 'Crear mesa' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .lib-ta { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 860px) { .lib-ta { grid-template-columns: 1fr minmax(300px, .9fr); align-items: start; } }
    .lib-ta__list, .lib-ta__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-ta__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-ta__list-title { font-size: var(--font-size-sm, .875rem); font-weight: 600; margin-bottom: var(--space-3, .75rem); }
    .lib-ta__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-ta__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-ta__item { display: flex; align-items: center; gap: var(--space-3, .75rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-ta__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-ta__item--off { opacity: .55; }
    .lib-ta__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-ta__info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-ta__info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-ta__acts { display: flex; gap: .35rem; }
    .lib-ta__icon { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-ta__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-ta__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-ta__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-ta__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }
    .lib-ta__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-ta__grow { flex: 1; }
    .lib-ta__chk { display: flex; align-items: center; gap: .4rem; font-size: var(--font-size-sm, .875rem); }
    .lib-ta__hint { margin: 0; font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); line-height: 1.4; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-ta__btn { padding: var(--space-3, .75rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-ta__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class TablesAdminComponent {
  readonly tables  = input<DiningTable[]>([]);
  readonly zones   = input<Zone[]>([]);
  readonly loading = input(false);

  readonly created = output<SaveTableRequest>();
  readonly updated = output<{ id: string; payload: SaveTableRequest }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly editingId = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    label:       ['', Validators.required],
    zoneId:      ['', Validators.required],
    capacityMin: [1, [Validators.required, Validators.min(1)]],
    capacityMax: [4, [Validators.required, Validators.min(1)]],
    sortOrder:   [0, Validators.min(0)],
    combinable:  [false],
  });

  edit(t: DiningTable): void {
    this.editingId.set(t.id);
    this.form.reset({
      label: t.label, zoneId: t.zoneId, capacityMin: t.capacityMin,
      capacityMax: t.capacityMax, sortOrder: t.sortOrder, combinable: t.combinable,
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ label: '', zoneId: '', capacityMin: 1, capacityMax: 4, sortOrder: 0, combinable: false });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: SaveTableRequest = {
      label:       v.label ?? '',
      zoneId:      v.zoneId ?? '',
      capacityMin: v.capacityMin ?? 1,
      capacityMax: v.capacityMax ?? 1,
      sortOrder:   v.sortOrder ?? 0,
      combinable:  v.combinable ?? false,
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
