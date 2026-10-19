import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SaveZoneRequest, Zone } from '@org/models';

/**
 * CRUD de zonas del local (Terraza, Salón, Barra). Componente controlado: el host posee el array y
 * hace el HTTP, reaccionando a `created`/`updated`/`toggled`/`deleted`.
 */
@Component({
  selector: 'lib-zones-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-za">
      <div class="lib-za__list">
        <h4 class="lib-za__list-title">Zonas · {{ zones().length }}</h4>
        @if (zones().length === 0) {
          <p class="lib-za__empty">Aún no hay zonas. Crea la primera.</p>
        } @else {
          <ul class="lib-za__items">
            @for (z of zones(); track z.id) {
              <li class="lib-za__item" [class.lib-za__item--off]="!z.active" [class.lib-za__item--active]="editingId() === z.id">
                <span class="lib-za__info"><strong>{{ z.name }}</strong><small>orden {{ z.sortOrder }}{{ z.active ? '' : ' · oculta' }}</small></span>
                <span class="lib-za__acts">
                  <button type="button" class="lib-za__icon" (click)="edit(z)" title="Editar">✏️</button>
                  <button type="button" class="lib-za__icon" (click)="toggled.emit(z.id)" title="Mostrar/ocultar">{{ z.active ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-za__icon lib-za__icon--danger" (click)="deleted.emit(z.id)" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <form class="lib-za__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-za__head">
          <h3 class="lib-za__title">{{ editingId() ? 'Editar zona' : 'Nueva zona' }}</h3>
          @if (editingId()) { <button type="button" class="lib-za__chip" (click)="reset()">Nueva</button> }
        </header>
        <div class="lib-field">
          <label class="lib-label" for="z-name">Nombre <span class="lib-required">*</span></label>
          <input id="z-name" class="lib-input" type="text" formControlName="name" placeholder="Terraza" />
        </div>
        <div class="lib-field">
          <label class="lib-label" for="z-order">Orden</label>
          <input id="z-order" class="lib-input" type="number" min="0" formControlName="sortOrder" />
        </div>
        <button type="submit" class="lib-za__btn" [disabled]="form.invalid || loading()">
          {{ editingId() ? 'Guardar cambios' : 'Crear zona' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .lib-za { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 760px) { .lib-za { grid-template-columns: 1fr minmax(240px, .7fr); align-items: start; } }
    .lib-za__list, .lib-za__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-za__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-za__list-title { font-size: var(--font-size-sm, .875rem); font-weight: 600; margin-bottom: var(--space-3, .75rem); }
    .lib-za__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-za__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-za__item { display: flex; align-items: center; gap: var(--space-3, .75rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-za__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-za__item--off { opacity: .55; }
    .lib-za__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-za__info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-za__info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-za__acts { display: flex; gap: .35rem; }
    .lib-za__icon { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-za__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-za__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-za__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-za__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-za__btn { padding: var(--space-3, .75rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-za__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ZonesAdminComponent {
  readonly zones   = input<Zone[]>([]);
  readonly loading = input(false);

  readonly created = output<SaveZoneRequest>();
  readonly updated = output<{ id: string; payload: SaveZoneRequest }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly editingId = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:      ['', Validators.required],
    sortOrder: [0, Validators.min(0)],
  });

  edit(z: Zone): void {
    this.editingId.set(z.id);
    this.form.reset({ name: z.name, sortOrder: z.sortOrder });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', sortOrder: 0 });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: SaveZoneRequest = { name: v.name ?? '', sortOrder: v.sortOrder ?? 0 };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
