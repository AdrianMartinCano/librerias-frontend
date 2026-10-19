import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { DailyMenu, MenuItem, SaveDailyMenuRequest } from '@org/models';

interface EditOption { itemId: string; name: string; description: string; supplement: number | null; }
interface EditCourse { name: string; choose: number; options: EditOption[]; }

/**
 * Gestor del menú del día: lista los menús de una fecha (publicar/despublicar/clonar/editar/borrar) y
 * un editor con grupos (Primeros, Postres…) cuyas opciones referencian un plato de la carta o son una
 * línea libre. Controlado: el host hace el HTTP y pasa la carta (`menuItems`) para el selector.
 */
@Component({
  selector: 'lib-daily-menu-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-dm">
      <!-- Lista del día -->
      <div class="lib-dm__list">
        <header class="lib-dm__head">
          <button type="button" class="lib-dm__nav" (click)="shiftDay(-1)" aria-label="Día anterior">‹</button>
          <h3 class="lib-dm__date">{{ date() }}</h3>
          <button type="button" class="lib-dm__nav" (click)="shiftDay(1)" aria-label="Día siguiente">›</button>
        </header>

        @if (dailyMenus().length === 0) {
          <p class="lib-dm__empty">Sin menús para este día.</p>
        } @else {
          <ul class="lib-dm__menus">
            @for (m of dailyMenus(); track m.id) {
              <li class="lib-dm__menu" [class.lib-dm__menu--active]="editingId() === m.id">
                <span class="lib-dm__menu-info">
                  <strong>{{ m.name }} · {{ m.price }} €</strong>
                  <small>{{ m.courses.length }} grupos · {{ m.published ? 'publicado' : 'borrador' }}</small>
                </span>
                <span class="lib-dm__menu-acts">
                  <button type="button" class="lib-dm__ico" (click)="editMenu(m)" title="Editar">✏️</button>
                  @if (m.published) {
                    <button type="button" class="lib-dm__ico" (click)="unpublished.emit(m.id)" title="Despublicar">📥</button>
                  } @else {
                    <button type="button" class="lib-dm__ico" (click)="published.emit(m.id)" title="Publicar">📤</button>
                  }
                  <button type="button" class="lib-dm__ico" (click)="startClone(m.id)" title="Clonar">📋</button>
                  <button type="button" class="lib-dm__ico lib-dm__ico--danger" (click)="deleted.emit(m.id)" title="Eliminar">🗑️</button>
                </span>
                @if (cloningId() === m.id) {
                  <span class="lib-dm__clone">
                    <input class="lib-input" type="date" [value]="cloneDate()" (input)="cloneDate.set($any($event.target).value)" />
                    <button type="button" class="lib-dm__clone-go" [disabled]="!cloneDate()" (click)="confirmClone(m.id)">Clonar</button>
                  </span>
                }
              </li>
            }
          </ul>
        }
        <button type="button" class="lib-dm__new" (click)="newMenu()">+ Nuevo menú</button>
      </div>

      <!-- Editor -->
      <div class="lib-dm__card">
        <h3 class="lib-dm__title">{{ editingId() ? 'Editar menú' : 'Nuevo menú del día' }}</h3>

        <div class="lib-dm__row">
          <div class="lib-field lib-dm__grow">
            <span class="lib-label">Nombre</span>
            <input class="lib-input" type="text" [value]="name()" (input)="name.set($any($event.target).value)" placeholder="Menú del día" />
          </div>
          <div class="lib-field">
            <span class="lib-label">Precio (€)</span>
            <input class="lib-input lib-dm__price" type="number" min="0" step="0.5" [value]="price() ?? ''" (input)="price.set(toNum($any($event.target).value))" />
          </div>
        </div>
        <div class="lib-field">
          <span class="lib-label">Descripción</span>
          <input class="lib-input" type="text" [value]="description()" (input)="description.set($any($event.target).value)" placeholder="Incluye pan, bebida y postre" />
        </div>

        @for (c of courses(); track $index; let ci = $index) {
          <fieldset class="lib-dm__course">
            <div class="lib-dm__course-head">
              <input class="lib-input" type="text" [value]="c.name" (input)="setCourseName(ci, $any($event.target).value)" placeholder="Primeros" />
              <label class="lib-dm__choose">elige <input class="lib-input" type="number" min="1" [value]="c.choose" (input)="setChoose(ci, $any($event.target).value)" /></label>
              <button type="button" class="lib-dm__ico lib-dm__ico--danger" (click)="removeCourse(ci)" title="Quitar grupo">🗑️</button>
            </div>

            @for (o of c.options; track $index; let oi = $index) {
              <div class="lib-dm__option">
                <select class="lib-input" [value]="o.itemId" (change)="setOptionItem(ci, oi, $any($event.target).value)">
                  <option value="">— línea libre —</option>
                  @for (it of menuItems(); track it.id) { <option [value]="it.id">{{ it.name }}</option> }
                </select>
                @if (!o.itemId) {
                  <input class="lib-input" type="text" [value]="o.name" (input)="setOptionName(ci, oi, $any($event.target).value)" placeholder="Especial del día" />
                }
                <input class="lib-input lib-dm__supp" type="number" min="0" step="0.5" [value]="o.supplement ?? ''" (input)="setOptionSupp(ci, oi, $any($event.target).value)" placeholder="supl." />
                <button type="button" class="lib-dm__ico lib-dm__ico--danger" (click)="removeOption(ci, oi)" title="Quitar opción">✕</button>
              </div>
            }
            <button type="button" class="lib-dm__add" (click)="addOption(ci)">+ Opción</button>
          </fieldset>
        }

        <button type="button" class="lib-dm__add" (click)="addCourse()">+ Añadir grupo</button>

        <div class="lib-dm__actions">
          @if (editingId()) { <button type="button" class="lib-dm__ghost" (click)="newMenu()">Cancelar</button> }
          <button type="button" class="lib-dm__save" [disabled]="!valid() || loading()" (click)="save()">
            {{ editingId() ? 'Guardar cambios' : 'Crear menú' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lib-dm { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 900px) { .lib-dm { grid-template-columns: minmax(280px, .8fr) 1fr; align-items: start; } }
    .lib-dm__list, .lib-dm__card { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); }
    .lib-dm__card { display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-dm__head { display: flex; align-items: center; gap: var(--space-2, .5rem); margin-bottom: var(--space-3, .75rem); }
    .lib-dm__nav { width: 2rem; height: 2rem; border-radius: 999px; border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff); cursor: pointer; }
    .lib-dm__date { margin: 0; font-size: var(--font-size-base, 1rem); font-weight: 700; flex: 1; text-align: center; }
    .lib-dm__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }
    .lib-dm__menus { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-dm__menu { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2, .5rem); padding: var(--space-2, .5rem) var(--space-3, .75rem); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); }
    .lib-dm__menu--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-dm__menu-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .lib-dm__menu-info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-dm__menu-info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-dm__menu-acts { display: flex; gap: .25rem; }
    .lib-dm__clone { display: flex; gap: .35rem; width: 100%; }
    .lib-dm__clone-go { background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); padding: .3rem .6rem; cursor: pointer; }
    .lib-dm__ico { width: 28px; height: 28px; border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; }
    .lib-dm__ico:hover { background: var(--color-surface, #f8f9fa); }
    .lib-dm__new, .lib-dm__add { align-self: flex-start; background: transparent; border: 1px dashed var(--color-border, #ccc); border-radius: var(--radius-md, .5rem); padding: .3rem .7rem; cursor: pointer; font-family: inherit; font-size: var(--font-size-sm, .875rem); margin-top: var(--space-2, .5rem); }
    .lib-dm__title { margin: 0; font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-dm__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-dm__grow { flex: 1; }
    .lib-dm__price { width: 110px; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-dm__course { border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem); padding: var(--space-3, .75rem); display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-dm__course-head { display: flex; gap: .5rem; align-items: center; }
    .lib-dm__choose { display: flex; align-items: center; gap: .3rem; font-size: var(--font-size-xs, .75rem); white-space: nowrap; }
    .lib-dm__choose input { width: 56px; }
    .lib-dm__option { display: flex; gap: .35rem; align-items: center; }
    .lib-dm__supp { width: 80px; }
    .lib-dm__actions { display: flex; justify-content: flex-end; gap: var(--space-2, .5rem); }
    .lib-dm__ghost { background: transparent; border: 1.5px solid var(--color-border, #e0e0e0); border-radius: var(--radius-md, .5rem); padding: var(--space-2, .5rem) var(--space-4, 1rem); cursor: pointer; font-family: inherit; }
    .lib-dm__save { background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); padding: var(--space-2, .5rem) var(--space-5, 1.25rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-dm__save:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class DailyMenuAdminComponent {
  readonly dailyMenus = input<DailyMenu[]>([]);
  readonly menuItems  = input<MenuItem[]>([]);
  readonly date       = input.required<string>();
  readonly loading    = input(false);

  readonly dateChange  = output<string>();
  readonly created     = output<SaveDailyMenuRequest>();
  readonly updated     = output<{ id: string; payload: SaveDailyMenuRequest }>();
  readonly published   = output<string>();
  readonly unpublished = output<string>();
  readonly cloned      = output<{ id: string; toDate: string }>();
  readonly deleted     = output<string>();

  readonly editingId   = signal<string | null>(null);
  readonly name        = signal('');
  readonly price       = signal<number | null>(null);
  readonly description = signal('');
  readonly courses     = signal<EditCourse[]>([]);
  readonly cloningId   = signal<string | null>(null);
  readonly cloneDate   = signal('');

  readonly valid = computed(() =>
    this.name().trim().length > 0 &&
    this.price() != null &&
    this.courses().length > 0 &&
    this.courses().every(c => c.name.trim() && c.options.length > 0 &&
      c.options.every(o => o.itemId || o.name.trim())));

  toNum(v: string): number | null { return v === '' ? null : Number(v); }

  shiftDay(delta: number): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() + delta);
    this.dateChange.emit(d.toISOString().slice(0, 10));
  }

  startClone(id: string): void {
    this.cloningId.set(this.cloningId() === id ? null : id);
    this.cloneDate.set('');
  }
  confirmClone(id: string): void {
    if (!this.cloneDate()) return;
    this.cloned.emit({ id, toDate: this.cloneDate() });
    this.cloningId.set(null);
  }

  newMenu(): void {
    this.editingId.set(null);
    this.name.set('Menú del día');
    this.price.set(null);
    this.description.set('');
    this.courses.set([]);
  }

  editMenu(m: DailyMenu): void {
    this.editingId.set(m.id);
    this.name.set(m.name);
    this.price.set(m.price);
    this.description.set(m.description ?? '');
    this.courses.set(m.courses.map(c => ({
      name: c.name, choose: c.choose,
      options: c.options.map(o => ({
        itemId: o.itemId ?? '', name: o.itemId ? '' : o.name,
        description: o.description ?? '', supplement: o.supplement ?? null,
      })),
    })));
  }

  /* ── Edición de grupos/opciones (inmutable sobre el signal) ── */

  addCourse(): void { this.courses.set([...this.courses(), { name: '', choose: 1, options: [] }]); }
  removeCourse(i: number): void { this.courses.set(this.courses().filter((_, idx) => idx !== i)); }
  setCourseName(i: number, v: string): void { this.patchCourse(i, c => ({ ...c, name: v })); }
  setChoose(i: number, v: string): void { this.patchCourse(i, c => ({ ...c, choose: Math.max(1, Number(v) || 1) })); }

  addOption(ci: number): void {
    this.patchCourse(ci, c => ({ ...c, options: [...c.options, { itemId: '', name: '', description: '', supplement: null }] }));
  }
  removeOption(ci: number, oi: number): void {
    this.patchCourse(ci, c => ({ ...c, options: c.options.filter((_, idx) => idx !== oi) }));
  }
  setOptionItem(ci: number, oi: number, itemId: string): void { this.patchOption(ci, oi, o => ({ ...o, itemId })); }
  setOptionName(ci: number, oi: number, name: string): void { this.patchOption(ci, oi, o => ({ ...o, name })); }
  setOptionSupp(ci: number, oi: number, v: string): void { this.patchOption(ci, oi, o => ({ ...o, supplement: this.toNum(v) })); }

  private patchCourse(i: number, fn: (c: EditCourse) => EditCourse): void {
    this.courses.set(this.courses().map((c, idx) => idx === i ? fn(c) : c));
  }
  private patchOption(ci: number, oi: number, fn: (o: EditOption) => EditOption): void {
    this.patchCourse(ci, c => ({ ...c, options: c.options.map((o, idx) => idx === oi ? fn(o) : o) }));
  }

  save(): void {
    if (!this.valid()) return;
    const payload: SaveDailyMenuRequest = {
      date:        this.date(),
      name:        this.name().trim(),
      price:       this.price() ?? 0,
      description: this.description().trim() || undefined,
      courses: this.courses().map(c => ({
        name: c.name.trim(),
        choose: c.choose,
        options: c.options.map(o => ({
          itemId:      o.itemId || undefined,
          name:        o.itemId ? undefined : o.name.trim(),
          description: o.description.trim() || undefined,
          supplement:  o.supplement ?? undefined,
        })),
      })),
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.newMenu();
  }
}
