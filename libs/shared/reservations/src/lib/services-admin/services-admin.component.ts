import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService as Service } from '@org/models';

/** Datos que el componente emite al crear/editar un servicio (espejo del CreateServiceOfferingRequest). */
export interface SaveServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  color?: string;
  imageUrl?: string;
}

/**
 * Editor del catálogo de servicios (CRUD) para el jefe: nombre, descripción, <b>duración</b> (define el
 * largo del hueco) y <b>precio</b> (se muestra en el flujo público), color y foto. Componente
 * <b>controlado</b>: el padre posee el array y reacciona a {@code created}/{@code updated}/
 * {@code toggled}/{@code deleted}; las llamadas a la API las hace el host.
 */
@Component({
  selector: 'lib-services-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-svc">
      <!-- Lista -->
      <div class="lib-svc__list">
        <h4 class="lib-svc__list-title">Servicios · {{ services().length }}</h4>
        @if (services().length === 0) {
          <p class="lib-svc__empty">Aún no hay servicios. Crea el primero a la derecha.</p>
        } @else {
          <ul class="lib-svc__items">
            @for (s of services(); track s.id) {
              <li class="lib-svc__item" [class.lib-svc__item--off]="s.active === false"
                  [class.lib-svc__item--active]="editingId() === s.id">
                <span class="lib-svc__swatch" [style.background]="s.color || 'var(--color-accent)'"></span>
                <span class="lib-svc__item-info">
                  <strong>{{ s.name }}</strong>
                  <small>{{ s.durationMinutes }} min{{ s.price !== undefined ? ' · ' + s.price + ' €' : '' }}{{ s.active === false ? ' · oculto' : '' }}</small>
                </span>
                <span class="lib-svc__item-acts">
                  <button type="button" class="lib-svc__icon" (click)="edit(s)" aria-label="Editar" title="Editar">✏️</button>
                  <button type="button" class="lib-svc__icon" (click)="toggled.emit(s.id)" aria-label="Mostrar/ocultar" title="Mostrar/ocultar">{{ s.active === false ? '✅' : '🚫' }}</button>
                  <button type="button" class="lib-svc__icon lib-svc__icon--danger" (click)="deleted.emit(s.id)" aria-label="Eliminar" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Formulario -->
      <form class="lib-svc__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-svc__head">
          <h3 class="lib-svc__title">{{ editingId() ? 'Editar servicio' : 'Nuevo servicio' }}</h3>
          @if (editingId()) { <button type="button" class="lib-svc__chip" (click)="reset()">Nuevo</button> }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="svc-name">Nombre <span class="lib-required">*</span></label>
          <input id="svc-name" class="lib-input" type="text" formControlName="name" placeholder="Corte de pelo" />
        </div>

        <div class="lib-svc__row">
          <div class="lib-field lib-svc__grow">
            <label class="lib-label" for="svc-dur">Duración (min) <span class="lib-required">*</span></label>
            <input id="svc-dur" class="lib-input" type="number" min="5" step="5" formControlName="durationMinutes" />
          </div>
          <div class="lib-field lib-svc__grow">
            <label class="lib-label" for="svc-price">Precio (€)</label>
            <input id="svc-price" class="lib-input" type="number" min="0" step="0.5" formControlName="price" />
          </div>
          <div class="lib-field">
            <label class="lib-label" for="svc-color">Color</label>
            <input id="svc-color" class="lib-input lib-svc__color" type="color" formControlName="color" />
          </div>
        </div>

        <div class="lib-field">
          <label class="lib-label" for="svc-desc">Descripción</label>
          <textarea id="svc-desc" class="lib-input lib-textarea" formControlName="description" rows="2" placeholder="Opcional"></textarea>
        </div>

        <div class="lib-field">
          <label class="lib-label" for="svc-img">Foto (URL)</label>
          <input id="svc-img" class="lib-input" type="url" formControlName="imageUrl" placeholder="https://…" />
        </div>

        <div class="lib-svc__actions">
          <button type="submit" class="lib-svc__btn" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="lib-spinner lib-spinner--sm lib-spinner--inverse"></span> }
            {{ editingId() ? 'Guardar cambios' : 'Crear servicio' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .lib-svc { display: grid; grid-template-columns: 1fr; gap: var(--space-5, 1.25rem); }
    @media (min-width: 860px) { .lib-svc { grid-template-columns: 1fr minmax(280px, .8fr); align-items: start; } }

    .lib-svc__list, .lib-svc__card {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
    }
    .lib-svc__card { display: flex; flex-direction: column; gap: var(--space-4, 1rem); }
    .lib-svc__list-title { font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); margin-bottom: var(--space-3, .75rem); }
    .lib-svc__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }

    .lib-svc__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-svc__item {
      display: flex; align-items: center; gap: var(--space-3, .75rem);
      padding: var(--space-2, .5rem) var(--space-3, .75rem);
      border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem);
    }
    .lib-svc__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-svc__item--off { opacity: .55; }
    .lib-svc__swatch { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
    .lib-svc__item-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .lib-svc__item-info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-svc__item-info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-svc__item-acts { display: flex; gap: var(--space-1, .35rem); flex-shrink: 0; }
    .lib-svc__icon {
      width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; font-size: .9rem;
    }
    .lib-svc__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-svc__icon--danger:hover { background: color-mix(in srgb, var(--color-danger, #dc3545) 14%, transparent); }

    .lib-svc__head { display: flex; align-items: center; justify-content: space-between; }
    .lib-svc__title { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .lib-svc__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }

    .lib-svc__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-svc__grow { flex: 1; }
    .lib-svc__color { padding: 2px; height: 38px; }
    .lib-field { display: flex; flex-direction: column; gap: var(--space-1, .35rem); }

    .lib-svc__actions { display: flex; }
    .lib-svc__btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      background: var(--color-accent, #ff4d4d); color: #fff; border: none;
      border-radius: var(--radius-md, .5rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; font-size: var(--font-size-base, 1rem); cursor: pointer;
    }
    .lib-svc__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ServicesAdminComponent {
  readonly services = input<Service[]>([]);
  readonly loading  = input(false);

  readonly created = output<SaveServicePayload>();
  readonly updated = output<{ id: string; payload: SaveServicePayload }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly editingId = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:            ['', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(5)]],
    price:           [null as number | null],
    color:           ['#0ea5e9'],
    description:     [''],
    imageUrl:        [''],
  });

  edit(s: Service): void {
    this.editingId.set(s.id);
    this.form.reset({
      name: s.name, durationMinutes: s.durationMinutes, price: s.price ?? null,
      color: s.color ?? '#0ea5e9', description: s.description ?? '', imageUrl: s.imageUrl ?? '',
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', durationMinutes: 30, price: null, color: '#0ea5e9', description: '', imageUrl: '' });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: SaveServicePayload = {
      name:            v.name ?? '',
      durationMinutes: v.durationMinutes ?? 30,
      price:           v.price ?? undefined,
      color:           v.color || undefined,
      description:     v.description || undefined,
      imageUrl:        v.imageUrl || undefined,
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
