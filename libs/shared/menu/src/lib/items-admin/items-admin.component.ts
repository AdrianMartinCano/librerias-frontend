import { Component, ChangeDetectionStrategy, computed, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Allergen, CreateMenuItemRequest, MenuCategory, MenuItem, PricedPortion } from '@org/models';
import { ALLERGEN_LABEL } from '../menu-format';

const ALLERGENS = Object.keys(ALLERGEN_LABEL) as Allergen[];

/**
 * CRUD de platos de la carta: precio base o raciones (tapa/media/ración), alérgenos, flags dietéticos
 * y badge. Sin imágenes. Controlado: necesita `categories` para el selector y emite los cambios al host.
 */
@Component({
  selector: 'lib-menu-items-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-mi">
      <div class="lib-mi__list">
        <h4 class="lib-mi__list-title">Platos · {{ items().length }}</h4>
        @if (items().length === 0) {
          <p class="lib-mi__empty">Aún no hay platos en esta categoría.</p>
        } @else {
          <ul class="lib-mi__items">
            @for (it of items(); track it.id) {
              <li class="lib-mi__item" [class.lib-mi__item--off]="!it.available" [class.lib-mi__item--active]="editingId() === it.id">
                <span class="lib-mi__info">
                  <strong>{{ it.name }}{{ it.badge ? ' · ' + it.badge : '' }}</strong>
                  <small>{{ priceText(it) }}{{ it.available ? '' : ' · agotado' }}</small>
                </span>
                <span class="lib-mi__acts">
                  <button type="button" class="lib-mi__ico" (click)="edit(it)" title="Editar">✏️</button>
                  <button type="button" class="lib-mi__ico" (click)="toggled.emit(it.id)" title="Disponibilidad">{{ it.available ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-mi__ico lib-mi__ico--danger" (click)="deleted.emit(it.id)" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <form class="lib-mi__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-mi__head">
          <h3 class="lib-mi__title">{{ editingId() ? 'Editar plato' : 'Nuevo plato' }}</h3>
          @if (editingId()) { <button type="button" class="lib-mi__chip" (click)="reset()">Nuevo</button> }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="mi-name">Nombre <span class="lib-required">*</span></label>
          <input id="mi-name" class="lib-input" type="text" formControlName="name" placeholder="Croquetas caseras" />
        </div>

        <div class="lib-field">
          <label class="lib-label" for="mi-cat">Categoría <span class="lib-required">*</span></label>
          <select id="mi-cat" class="lib-input" formControlName="categoryId">
            <option value="">— elige —</option>
            @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
        </div>

        <div class="lib-field">
          <label class="lib-label" for="mi-desc">Descripción</label>
          <textarea id="mi-desc" class="lib-input" rows="2" formControlName="description"></textarea>
        </div>

        <div class="lib-mi__row">
          <div class="lib-field lib-mi__grow">
            <label class="lib-label" for="mi-price">Precio base (€)</label>
            <input id="mi-price" class="lib-input" type="number" min="0" step="0.5" formControlName="price" />
          </div>
          <div class="lib-field lib-mi__grow">
            <label class="lib-label" for="mi-badge">Badge</label>
            <input id="mi-badge" class="lib-input" type="text" formControlName="badge" placeholder="Sugerencia del chef" />
          </div>
        </div>

        <div class="lib-field">
          <span class="lib-label">Raciones (opcional; si las usas, el precio base es "desde")</span>
          @for (p of portions(); track $index) {
            <div class="lib-mi__portion">
              <input class="lib-input" type="text" [value]="p.label" (input)="setPortionLabel($index, $any($event.target).value)" placeholder="Media" />
              <input class="lib-input lib-mi__amount" type="number" min="0" step="0.5" [value]="p.amount" (input)="setPortionAmount($index, $any($event.target).value)" />
              <button type="button" class="lib-mi__ico lib-mi__ico--danger" (click)="removePortion($index)" title="Quitar">🗑️</button>
            </div>
          }
          <button type="button" class="lib-mi__add" (click)="addPortion()">+ Añadir ración</button>
        </div>

        <div class="lib-field">
          <span class="lib-label">Dietético</span>
          <div class="lib-mi__flags">
            <label class="lib-mi__flag"><input type="checkbox" formControlName="vegan" /> 🌱 Vegano</label>
            <label class="lib-mi__flag"><input type="checkbox" formControlName="vegetarian" /> 🥬 Vegetariano</label>
            <label class="lib-mi__flag"><input type="checkbox" formControlName="glutenFree" /> 🚫🌾 Sin gluten</label>
            <label class="lib-mi__flag"><input type="checkbox" formControlName="spicy" /> 🌶️ Picante</label>
          </div>
        </div>

        <div class="lib-field">
          <span class="lib-label">Alérgenos</span>
          <div class="lib-mi__allergens">
            @for (a of allergenOptions; track a.value) {
              <button type="button" class="lib-mi__alg" [class.lib-mi__alg--on]="allergens().includes(a.value)" (click)="toggleAllergen(a.value)">{{ a.label }}</button>
            }
          </div>
        </div>

        <button type="submit" class="lib-mi__btn" [disabled]="!canSubmit() || loading()">
          {{ editingId() ? 'Guardar cambios' : 'Crear plato' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .lib-mi { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 900px) { .lib-mi { grid-template-columns: 1fr minmax(320px, 1fr); align-items: start; } }
    .lib-mi__list, .lib-mi__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-mi__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-mi__list-title { font-size: var(--font-size-sm, .875rem); font-weight: 600; margin-bottom: var(--space-3, .75rem); }
    .lib-mi__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-mi__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-mi__item { display: flex; align-items: center; gap: var(--space-3, .75rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-mi__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-mi__item--off { opacity: .55; }
    .lib-mi__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-mi__info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-mi__info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-mi__acts { display: flex; gap: .35rem; }
    .lib-mi__ico { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-mi__ico:hover { background: var(--color-surface, #f8f9fa); }
    .lib-mi__head { display: flex; justify-content: space-between; align-items: center; }
    .lib-mi__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-mi__chip { font-size: var(--font-size-xs, .75rem); border: 1px solid var(--color-border, #e2e2e2); background: transparent; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }
    .lib-mi__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-mi__grow { flex: 1; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-mi__portion { display: flex; gap: .35rem; align-items: center; }
    .lib-mi__amount { width: 90px; }
    .lib-mi__add { align-self: flex-start; background: transparent; border: 1px dashed var(--color-border, #ccc); border-radius: var(--radius-md, .5rem); padding: .3rem .6rem; cursor: pointer; font-family: inherit; font-size: var(--font-size-sm, .875rem); }
    .lib-mi__flags { display: flex; flex-wrap: wrap; gap: var(--space-3, .75rem); }
    .lib-mi__flag { display: flex; align-items: center; gap: .3rem; font-size: var(--font-size-sm, .875rem); }
    .lib-mi__allergens { display: flex; flex-wrap: wrap; gap: .3rem; }
    .lib-mi__alg { border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff); border-radius: var(--radius-md, .5rem); padding: .25rem .5rem; cursor: pointer; font-size: var(--font-size-xs, .75rem); font-family: inherit; color: var(--color-text, #1a1a1a); }
    .lib-mi__alg--on { background: var(--color-accent, #ff4d4d); border-color: var(--color-accent, #ff4d4d); color: #fff; }
    .lib-mi__btn { padding: var(--space-3, .75rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-mi__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class MenuItemsAdminComponent {
  readonly items      = input<MenuItem[]>([]);
  readonly categories = input<MenuCategory[]>([]);
  readonly loading    = input(false);

  readonly created = output<CreateMenuItemRequest>();
  readonly updated = output<{ id: string; payload: CreateMenuItemRequest }>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  readonly allergenOptions = ALLERGENS.map(value => ({ value, label: ALLERGEN_LABEL[value] }));
  readonly editingId = signal<string | null>(null);
  readonly portions  = signal<PricedPortion[]>([]);
  readonly allergens = signal<Allergen[]>([]);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:        ['', Validators.required],
    categoryId:  ['', Validators.required],
    description: [''],
    price:       [null as number | null],
    badge:       [''],
    vegan:       [false],
    vegetarian:  [false],
    glutenFree:  [false],
    spicy:       [false],
  });

  readonly canSubmit = computed(() => {
    const hasPrice = this.form.controls.price.value != null;
    const hasPortion = this.portions().some(p => p.label.trim() && p.amount >= 0);
    return this.form.valid && (hasPrice || hasPortion);
  });

  priceText(it: MenuItem): string {
    if (it.portions.length) return it.portions.map(p => `${p.label} ${p.amount}€`).join(' · ');
    return it.price != null ? `${it.price} €` : 'sin precio';
  }

  addPortion(): void { this.portions.set([...this.portions(), { label: '', amount: 0 }]); }
  removePortion(i: number): void { this.portions.set(this.portions().filter((_, idx) => idx !== i)); }
  setPortionLabel(i: number, value: string): void {
    this.portions.set(this.portions().map((p, idx) => idx === i ? { ...p, label: value } : p));
  }
  setPortionAmount(i: number, value: string): void {
    this.portions.set(this.portions().map((p, idx) => idx === i ? { ...p, amount: Number(value) || 0 } : p));
  }

  toggleAllergen(a: Allergen): void {
    const set = new Set(this.allergens());
    if (set.has(a)) set.delete(a); else set.add(a);
    this.allergens.set([...set]);
  }

  edit(it: MenuItem): void {
    this.editingId.set(it.id);
    this.portions.set(it.portions.map(p => ({ ...p })));
    this.allergens.set([...it.allergens]);
    this.form.reset({
      name: it.name, categoryId: it.categoryId, description: it.description ?? '',
      price: it.price ?? null, badge: it.badge ?? '',
      vegan: it.vegan, vegetarian: it.vegetarian, glutenFree: it.glutenFree, spicy: it.spicy,
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.portions.set([]);
    this.allergens.set([]);
    this.form.reset({ name: '', categoryId: '', description: '', price: null, badge: '', vegan: false, vegetarian: false, glutenFree: false, spicy: false });
  }

  submit(): void {
    if (!this.canSubmit()) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const portions = this.portions().filter(p => p.label.trim());
    const payload: CreateMenuItemRequest = {
      name:        v.name ?? '',
      categoryId:  v.categoryId ?? '',
      description: v.description || undefined,
      price:       v.price ?? undefined,
      badge:       v.badge || undefined,
      portions:    portions.length ? portions : undefined,
      allergens:   this.allergens(),
      vegan:       v.vegan ?? false,
      vegetarian:  v.vegetarian ?? false,
      glutenFree:  v.glutenFree ?? false,
      spicy:       v.spicy ?? false,
      sortOrder:   0,
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }
}
