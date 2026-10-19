import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryIcon, CreateMenuCategoryRequest, MenuCategory } from '@org/models';
import { CATEGORY_ICON } from '../menu-format';

const ICONS = Object.keys(CATEGORY_ICON) as CategoryIcon[];

/**
 * CRUD de categorías de la carta (Entrantes, Carnes, Postres…). Sin imágenes: solo un icono curado.
 * Componente controlado: el host posee el array y hace el HTTP.
 */
@Component({
  selector: 'lib-menu-categories-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-mc">
      <div class="lib-mc__list">
        <h4 class="lib-mc__list-title">Categorías · {{ categories().length }}</h4>
        @if (categories().length === 0) {
          <p class="lib-mc__empty">Aún no hay categorías. Crea la primera.</p>
        } @else {
          <ul class="lib-mc__items">
            @for (c of categories(); track c.id) {
              <li class="lib-mc__item" [class.lib-mc__item--off]="!c.active" [class.lib-mc__item--active]="editingId() === c.id">
                <span class="lib-mc__icon-cell">{{ iconEmoji(c.icon) }}</span>
                <span class="lib-mc__info"><strong>{{ c.name }}</strong><small>orden {{ c.sortOrder }}{{ c.active ? '' : ' · oculta' }}</small></span>
                <span class="lib-mc__acts">
                  <button type="button" class="lib-mc__ico" (click)="edit(c)" title="Editar">✏️</button>
                  <button type="button" class="lib-mc__ico" (click)="toggled.emit(c.id)" title="Mostrar/ocultar">{{ c.active ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-mc__ico lib-mc__ico--danger" (click)="deleted.emit(c.id)" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <form class="lib-mc__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-mc__head">
          <h3 class="lib-mc__title">{{ editingId() ? 'Editar categoría' : 'Nueva categoría' }}</h3>
          @if (editingId()) { <button type="button" class="lib-mc__chip" (click)="reset()">Nueva</button> }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="mc-name">Nombre <span class="lib-required">*</span></label>
          <input id="mc-name" class="lib-input" type="text" formControlName="name" placeholder="Entrantes" />
        </div>
        <div class="lib-field">
          <label class="lib-label" for="mc-icon">Icono</label>
          <select id="mc-icon" class="lib-input" formControlName="icon">
            @for (i of icons; track i) { <option [value]="i">{{ iconEmoji(i) }} {{ i }}</option> }
          </select>
        </div>
        <div class="lib-field">
          <label class="lib-label" for="mc-desc">Descripción</label>
          <textarea id="mc-desc" class="lib-input" rows="2" formControlName="description" placeholder="Opcional"></textarea>
        </div>
        <div class="lib-field">
          <label class="lib-label" for="mc-order">Orden</label>
          <input id="mc-order" class="lib-input" type="number" min="0" formControlName="sortOrder" />
        </div>
        <button type="submit" class="lib-mc__btn" [disabled]="form.invalid || loading()">
          {{ editingId() ? 'Guardar cambios' : 'Crear categoría' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .lib-mc { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 760px) { .lib-mc { grid-template-columns: 1fr minmax(260px, .7fr); align-items: start; } }
    .lib-mc__list, .lib-mc__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-mc__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-mc__list-title { font-size: var(--font-size-sm, .875rem); font-weight: 600; margin-bottom: var(--space-3, .75rem); }
    .lib-mc__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-mc__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-mc__item { display: flex; align-items: center; gap: var(--space-3, .75rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-mc__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-mc__item--off { opacity: .55; }
    .lib-mc__icon-cell { font-size: 1.1rem; width: 1.5rem; text-align: center; }
    .lib-mc__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-mc__info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-mc__info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-mc__acts { display: flex; gap: .35rem; }
    .lib-mc__ico { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-mc__ico:hover { background: var(--color-surface, #f8f9fa); }
    .lib-mc__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-mc__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-mc__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-mc__btn { padding: var(--space-3, .75rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-mc__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class MenuCategoriesAdminComponent {
  readonly categories = input<MenuCategory[]>([]);
  readonly loading    = input(false);

  readonly created = output<CreateMenuCategoryRequest>();
  readonly updated = output<{ id: string; payload: CreateMenuCategoryRequest }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly icons = ICONS;
  readonly editingId = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:        ['', Validators.required],
    icon:        ['NONE' as CategoryIcon],
    description: [''],
    sortOrder:   [0, Validators.min(0)],
  });

  iconEmoji(i: CategoryIcon): string { return CATEGORY_ICON[i]; }

  edit(c: MenuCategory): void {
    this.editingId.set(c.id);
    this.form.reset({ name: c.name, icon: c.icon, description: c.description ?? '', sortOrder: c.sortOrder });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', icon: 'NONE', description: '', sortOrder: 0 });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload: CreateMenuCategoryRequest = {
      name:        v.name ?? '',
      icon:        v.icon ?? 'NONE',
      description: v.description || undefined,
      sortOrder:   v.sortOrder ?? 0,
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
