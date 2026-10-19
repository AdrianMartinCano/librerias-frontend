import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StaffAdmin, BookingService as Service, TimeRange } from '@org/models';
import { VacationPickerComponent } from '../vacation-picker/vacation-picker.component';

/** Cuenta seleccionable para vincular a un profesional (la pasa el host desde /api/admin/users). */
export interface StaffUserOption { id: string; name: string; email: string; }

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

/** Datos que el componente emite al crear/editar (espejo del SaveStaffRequest del backend). */
export interface SaveStaffPayload {
  name: string;
  color?: string;
  imageUrl?: string;
  active: boolean;
  sortOrder: number;
  userId?: string;
  customHours: boolean;
  weeklyHours: Record<string, { start: string; end: string }[]>;
  blockedDates: string[];
  serviceIds: string[];
  /**
   * Si está presente, el host debe CREAR la cuenta (POST /api/admin/users con ROLE_STAFF) y vincular el
   * trabajador al userId resultante. Mutuamente excluyente con {@link userId}.
   */
  account?: { name: string; email: string; password: string };
}

/**
 * Gestión del equipo (CRUD de profesionales) para el jefe. Componente <b>controlado</b>: el padre posee
 * el array y reacciona a {@code created}/{@code updated}/{@code toggled}/{@code deleted}/{@code includeMe}.
 *
 * <p>El horario propio, vacaciones y servicios se editan en una fase posterior; aquí se preservan los
 * valores existentes del profesional al guardar para no perderlos.</p>
 */
@Component({
  selector: 'lib-staff-admin',
  standalone: true,
  imports: [ReactiveFormsModule, VacationPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-sadm">
      <!-- Lista del equipo -->
      <div class="lib-sadm__list">
        <div class="lib-sadm__list-head">
          <h4 class="lib-sadm__list-title">Equipo · {{ staff().length }}</h4>
          <button type="button" class="lib-sadm__btn lib-sadm__btn--ghost" (click)="includeMe.emit()">
            + Incluirme
          </button>
        </div>
        @if (staff().length === 0) {
          <p class="lib-sadm__empty">Aún no hay profesionales. Crea el primero a la derecha.</p>
        } @else {
          <ul class="lib-sadm__items">
            @for (p of staff(); track p.id) {
              <li class="lib-sadm__item" [class.lib-sadm__item--off]="!p.active"
                  [class.lib-sadm__item--active]="editingId() === p.id">
                <span class="lib-sadm__swatch" [style.background]="p.color || 'var(--color-accent)'"></span>
                <span class="lib-sadm__item-info">
                  <strong>{{ p.name }}</strong>
                  <small>{{ p.userId ? 'con cuenta' : 'sin login' }}{{ p.active ? '' : ' · inactivo' }}</small>
                </span>
                <span class="lib-sadm__item-acts">
                  <button type="button" class="lib-sadm__icon" (click)="edit(p)" aria-label="Editar" title="Editar">✏️</button>
                  <button type="button" class="lib-sadm__icon" (click)="toggled.emit(p.id)" aria-label="Activar/desactivar" title="Activar/desactivar">{{ p.active ? '🚫' : '✅' }}</button>
                  <button type="button" class="lib-sadm__icon lib-sadm__icon--danger" (click)="deleted.emit(p.id)" aria-label="Eliminar" title="Eliminar">🗑️</button>
                </span>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Formulario alta/edición -->
      <form class="lib-sadm__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <header class="lib-sadm__head">
          <h3 class="lib-sadm__title">{{ editingId() ? 'Editar profesional' : 'Nuevo profesional' }}</h3>
          @if (editingId()) {
            <button type="button" class="lib-sadm__new" (click)="reset()">＋ Nuevo profesional</button>
          }
        </header>

        <div class="lib-field">
          <label class="lib-label" for="sadm-name">Nombre <span class="lib-required">*</span></label>
          <input id="sadm-name" class="lib-input" type="text" formControlName="name" placeholder="Nombre del profesional" />
        </div>

        <div class="lib-sadm__row">
          <div class="lib-field">
            <label class="lib-label" for="sadm-color">Color</label>
            <input id="sadm-color" class="lib-input lib-sadm__color" type="color" formControlName="color" />
          </div>
          <div class="lib-field lib-sadm__grow">
            <label class="lib-label" for="sadm-order">Orden</label>
            <input id="sadm-order" class="lib-input" type="number" min="0" formControlName="sortOrder" />
          </div>
        </div>

        <div class="lib-field">
          <span class="lib-label">Foto de perfil</span>
          <div class="lib-sadm__photo">
            @if (photo()) {
              <img class="lib-sadm__avatar" [src]="photo()" alt="Foto del profesional" />
            } @else {
              <span class="lib-sadm__avatar lib-sadm__avatar--empty" aria-hidden="true">📷</span>
            }
            <div class="lib-sadm__photo-actions">
              <label class="lib-sadm__upload">
                {{ photo() ? 'Cambiar foto' : 'Subir foto' }}
                <input type="file" accept="image/*" (change)="onPhotoSelected($event)" hidden />
              </label>
              @if (photo()) {
                <button type="button" class="lib-sadm__photo-x" (click)="photo.set('')">Quitar</button>
              }
            </div>
          </div>
        </div>

        <div class="lib-field">
          <label class="lib-label" for="sadm-user">Email</label>
          <select id="sadm-user" class="lib-input lib-select" formControlName="userId" (change)="onAccountModeChange()">
            <option value="">— sin login —</option>
            @if (!editingId()) { <option value="__new__">➕ Crear cuenta nueva…</option> }
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.name }} ({{ u.email }})</option>
            }
          </select>
        </div>

        @if (creatingAccount()) {
          <div class="lib-sadm__row">
            <div class="lib-field lib-sadm__grow">
              <label class="lib-label" for="sadm-email">Email cuenta <span class="lib-required">*</span></label>
              <input id="sadm-email" class="lib-input" type="email" formControlName="email" placeholder="trabajador@negocio.com" autocomplete="off" />
            </div>
            <div class="lib-field lib-sadm__grow">
              <label class="lib-label" for="sadm-pass">Contraseña <span class="lib-required">*</span></label>
              <input id="sadm-pass" class="lib-input" type="password" formControlName="password" placeholder="mín. 8 caracteres" autocomplete="new-password" />
            </div>
          </div>
          <p class="lib-sadm__note">Se creará una cuenta con rol de trabajador (ROLE_STAFF) vinculada a este profesional.</p>
        }

        <!-- Servicios que realiza -->
        @if (services().length) {
          <div class="lib-field">
            <span class="lib-label">Servicios que realiza</span>
            <p class="lib-sadm__note">Sin marcar ninguno = hace todos.</p>
            <div class="lib-sadm__chips">
              @for (s of services(); track s.id) {
                <label class="lib-sadm__chip-check" [class.lib-sadm__chip-check--on]="isServiceOn(s.id)">
                  <input type="checkbox" [checked]="isServiceOn(s.id)" (change)="toggleService(s.id)" />
                  {{ s.name }}
                </label>
              }
            </div>
          </div>
        }

        <!-- Horario propio -->
        <label class="lib-sadm__check">
          <input type="checkbox" [checked]="customHours()" (change)="setCustomHours($event)" />
          Horario propio
        </label>
        @if (customHours()) {
          <div class="lib-sadm__week">
            @for (d of days; track d.value) {
              <div class="lib-sadm__day" [class.lib-sadm__day--open]="isOpen(d.value)">
                <label class="lib-sadm__day-toggle">
                  <input type="checkbox" [checked]="isOpen(d.value)" (change)="setDayOpen(d.value, $event)" />
                  <span class="lib-sadm__day-name">{{ d.label }}</span>
                </label>
                @if (isOpen(d.value)) {
                  <div class="lib-sadm__ranges">
                    @for (r of rangesOf(d.value); track $index) {
                      <span class="lib-sadm__range">
                        <input class="lib-input lib-sadm__time" type="time" [value]="r.start" (change)="setRange(d.value, $index, 'start', $event)" />
                        <span class="lib-sadm__dash">–</span>
                        <input class="lib-input lib-sadm__time" type="time" [value]="r.end" (change)="setRange(d.value, $index, 'end', $event)" />
                        <button type="button" class="lib-sadm__x" (click)="removeRange(d.value, $index)" aria-label="Quitar tramo">×</button>
                      </span>
                    }
                    <button type="button" class="lib-sadm__add" (click)="addRange(d.value)">+ tramo</button>
                  </div>
                } @else { <span class="lib-sadm__closed">Cerrado</span> }
              </div>
            }
          </div>
        }

        <!-- Vacaciones propias -->
        <div class="lib-field">
          <span class="lib-label">Vacaciones / días libres</span>
          <p class="lib-sadm__note">Se suman a los festivos del negocio.</p>
          <lib-vacation-picker [dates]="blocked()" (datesChange)="blocked.set($event)" />
        </div>

        @if (scheduleError()) { <p class="lib-sadm__err" role="alert">⚠️ {{ scheduleError() }}</p> }

        <label class="lib-sadm__check">
          <input type="checkbox" formControlName="active" /> Activo (visible para reservar)
        </label>

        <div class="lib-sadm__actions">
          <button type="submit" class="lib-sadm__btn" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="lib-spinner lib-spinner--sm lib-spinner--inverse"></span> }
            {{ editingId() ? 'Guardar cambios' : 'Crear profesional' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .lib-sadm { display: grid; grid-template-columns: 1fr; gap: var(--space-5, 1.25rem); }
    @media (min-width: 860px) { .lib-sadm { grid-template-columns: 1fr minmax(280px, .8fr); align-items: start; } }

    .lib-sadm__list, .lib-sadm__card {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
    }
    .lib-sadm__card { display: flex; flex-direction: column; gap: var(--space-4, 1rem); }

    .lib-sadm__list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3, .75rem); }
    .lib-sadm__list-title { font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); }
    .lib-sadm__empty { font-size: var(--font-size-sm, .875rem); color: var(--color-text-muted, #909090); }

    .lib-sadm__items { display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
    .lib-sadm__item {
      display: flex; align-items: center; gap: var(--space-3, .75rem);
      padding: var(--space-2, .5rem) var(--space-3, .75rem);
      border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-md, .5rem);
    }
    .lib-sadm__item--active { border-color: var(--color-accent, #ff4d4d); box-shadow: 0 0 0 1px var(--color-accent, #ff4d4d); }
    .lib-sadm__item--off { opacity: .55; }
    .lib-sadm__swatch { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
    .lib-sadm__item-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .lib-sadm__item-info strong { font-size: var(--font-size-sm, .875rem); }
    .lib-sadm__item-info small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-sadm__item-acts { display: flex; gap: var(--space-1, .35rem); flex-shrink: 0; }
    .lib-sadm__icon {
      width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: var(--radius-md, .5rem); cursor: pointer; font-size: .9rem;
    }
    .lib-sadm__icon:hover { background: var(--color-surface, #f8f9fa); }
    .lib-sadm__icon--danger:hover { background: color-mix(in srgb, var(--color-danger, #dc3545) 14%, transparent); }

    .lib-sadm__head { display: flex; align-items: center; justify-content: space-between; }
    .lib-sadm__title { font-size: var(--font-size-lg, 1.125rem); font-weight: var(--font-weight-bold, 700); }
    .lib-sadm__new {
      display: inline-flex; align-items: center; gap: .35rem;
      font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-semibold, 600); font-family: inherit;
      color: var(--color-accent, #ff4d4d); cursor: pointer; white-space: nowrap;
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-accent, #ff4d4d) 35%, transparent);
      border-radius: var(--radius-md, .5rem); padding: .4rem .75rem;
      transition: background var(--transition-fast, 120ms ease);
    }
    .lib-sadm__new:hover { background: color-mix(in srgb, var(--color-accent, #ff4d4d) 18%, transparent); }

    /* Foto de perfil (subida) */
    .lib-sadm__photo { display: flex; align-items: center; gap: var(--space-3, .75rem); }
    .lib-sadm__avatar {
      width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
      border: 1px solid var(--color-border, #e2e2e2);
    }
    .lib-sadm__avatar--empty {
      display: inline-flex; align-items: center; justify-content: center; font-size: 1.4rem;
      background: var(--color-surface, #f8f9fa); color: var(--color-text-muted, #909090);
    }
    .lib-sadm__photo-actions { display: flex; align-items: center; gap: var(--space-3, .75rem); flex-wrap: wrap; }
    .lib-sadm__upload {
      display: inline-flex; align-items: center; cursor: pointer;
      padding: .4rem .75rem; border: 1px solid var(--color-border, #e2e2e2);
      background: var(--color-surface, #f8f9fa); border-radius: var(--radius-md, .5rem);
      font-size: var(--font-size-sm, .875rem); font-weight: var(--font-weight-medium, 500);
    }
    .lib-sadm__upload:hover { border-color: var(--color-accent, #ff4d4d); color: var(--color-accent, #ff4d4d); }
    .lib-sadm__photo-x {
      border: none; background: none; cursor: pointer; font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-muted, #909090);
    }
    .lib-sadm__photo-x:hover { color: var(--color-danger, #dc3545); }

    .lib-sadm__row { display: flex; gap: var(--space-3, .75rem); }
    .lib-sadm__grow { flex: 1; }
    .lib-sadm__color { padding: 2px; height: 38px; }
    .lib-field { display: flex; flex-direction: column; gap: var(--space-1, .35rem); }
    .lib-sadm__check { display: flex; align-items: center; gap: var(--space-2, .5rem); font-size: var(--font-size-sm, .875rem); }
    .lib-sadm__note { font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); margin: 0; }

    /* Servicios / vacaciones (chips) */
    .lib-sadm__chips { display: flex; flex-wrap: wrap; gap: var(--space-2, .5rem); margin-top: var(--space-1, .35rem); }
    .lib-sadm__chip-check {
      display: inline-flex; align-items: center; gap: .4rem; cursor: pointer;
      padding: .3rem .6rem; border: 1px solid var(--color-border, #e2e2e2); border-radius: 999px;
      font-size: var(--font-size-sm, .875rem);
    }
    .lib-sadm__chip-check--on { border-color: var(--color-accent, #ff4d4d); background: color-mix(in srgb, var(--color-accent, #ff4d4d) 8%, transparent); }
    .lib-sadm__vac { display: inline-flex; align-items: center; gap: .3rem; font-variant-numeric: tabular-nums;
      padding: .3rem .6rem; border: 1px solid var(--color-border, #e2e2e2); border-radius: 999px; font-size: var(--font-size-sm, .875rem); }

    /* Horario por día */
    .lib-sadm__week { display: flex; flex-direction: column; gap: var(--space-1, .35rem); }
    .lib-sadm__day { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2, .5rem) var(--space-3, .75rem);
      padding: var(--space-2, .5rem) 0; border-bottom: 1px solid var(--color-surface-alt, #f0f0f0); }
    .lib-sadm__day-toggle { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; min-width: 110px; }
    .lib-sadm__day-name { font-weight: var(--font-weight-semibold, 600); font-size: var(--font-size-sm, .875rem); }
    .lib-sadm__day:not(.lib-sadm__day--open) .lib-sadm__day-name { color: var(--color-text-muted, #909090); font-weight: var(--font-weight-medium, 500); }
    .lib-sadm__closed { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .lib-sadm__ranges { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2, .5rem); }
    .lib-sadm__range { display: inline-flex; align-items: center; gap: .35rem; }
    .lib-sadm__time { width: auto; padding: .3rem .4rem; }
    .lib-sadm__dash { color: var(--color-text-muted, #909090); }
    .lib-sadm__vac-add { display: flex; align-items: center; gap: var(--space-2, .5rem); flex-wrap: wrap; margin-top: var(--space-1, .35rem); }
    .lib-sadm__add { padding: .3rem .7rem; border: 1px solid var(--color-border, #e2e2e2);
      background: var(--color-surface, #f8f9fa); border-radius: var(--radius-md, .5rem);
      font-family: inherit; font-size: var(--font-size-sm, .875rem); cursor: pointer; white-space: nowrap; }
    .lib-sadm__x { border: none; background: none; cursor: pointer; font-size: 1.15rem; line-height: 1; color: var(--color-text-muted, #909090); padding: 0 .15rem; }
    .lib-sadm__x:hover { color: var(--color-danger, #dc3545); }
    .lib-sadm__err { color: var(--color-danger, #dc3545); font-size: var(--font-size-sm, .875rem); margin: 0; }

    .lib-sadm__actions { display: flex; }
    .lib-sadm__btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2, .5rem);
      padding: var(--space-3, .75rem) var(--space-5, 1.25rem);
      background: var(--color-accent, #ff4d4d); color: #fff; border: none;
      border-radius: var(--radius-md, .5rem); font-weight: var(--font-weight-semibold, 600);
      font-family: inherit; font-size: var(--font-size-base, 1rem); cursor: pointer;
    }
    .lib-sadm__btn:disabled { opacity: .5; cursor: not-allowed; }
    .lib-sadm__btn--ghost { flex: 0 0 auto; background: transparent; color: var(--color-text-muted, #909090); border: 1px solid var(--color-border, #e2e2e2); padding: .35rem .7rem; font-size: var(--font-size-sm, .875rem); }
  `],
})
export class StaffAdminComponent {
  readonly staff    = input<StaffAdmin[]>([]);
  readonly users    = input<StaffUserOption[]>([]);
  /** Catálogo de servicios, para elegir cuáles realiza el profesional. */
  readonly services = input<Service[]>([]);
  readonly loading  = input(false);

  readonly days = DAYS;

  readonly created  = output<SaveStaffPayload>();
  readonly updated  = output<{ id: string; payload: SaveStaffPayload }>();
  readonly toggled  = output<string>();
  readonly deleted  = output<string>();
  readonly includeMe = output<void>();

  readonly editingId = signal<string | null>(null);
  /** true cuando en el desplegable de acceso se eligió "Crear cuenta nueva". */
  readonly creatingAccount = signal(false);
  private static readonly NEW_ACCOUNT = '__new__';

  // Estado del horario/servicios/vacaciones que ahora SÍ se editan (Fase 3).
  readonly customHours   = signal(false);
  readonly weekly        = signal<Record<string, TimeRange[]>>({});
  readonly blocked       = signal<string[]>([]);
  readonly serviceIds    = signal<string[]>([]);
  readonly scheduleError = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name:      ['', Validators.required],
    color:     ['#1e3a8a'],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    userId:    [''],
    active:    [true],
    email:     [''],
    password:  [''],
  });

  /** Foto: data URL de la imagen subida o la URL existente. */
  readonly photo = signal('');

  /** Lee el archivo elegido y lo guarda como data URL (preview + persistencia sin backend). */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';                 // permite re-seleccionar el mismo archivo
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.photo.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onAccountModeChange(): void {
    this.creatingAccount.set(this.form.controls.userId.value === StaffAdminComponent.NEW_ACCOUNT);
  }

  edit(p: StaffAdmin): void {
    this.editingId.set(p.id);
    this.creatingAccount.set(false);
    this.scheduleError.set(null);
    this.customHours.set(p.customHours);
    this.weekly.set({ ...(p.weeklyHours ?? {}) });
    this.blocked.set([...(p.blockedDates ?? [])].sort());
    this.serviceIds.set([...(p.serviceIds ?? [])]);
    this.photo.set(p.imageUrl ?? '');
    this.form.reset({
      name: p.name, color: p.color ?? '#1e3a8a',
      sortOrder: p.sortOrder, userId: p.userId ?? '', active: p.active, email: '', password: '',
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.creatingAccount.set(false);
    this.scheduleError.set(null);
    this.customHours.set(false);
    this.weekly.set({});
    this.blocked.set([]);
    this.serviceIds.set([]);
    this.photo.set('');
    this.form.reset({ name: '', color: '#1e3a8a', sortOrder: 0, userId: '', active: true, email: '', password: '' });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const newAccount = this.creatingAccount();

    if (newAccount && (!this.isEmail(v.email) || (v.password ?? '').length < 8)) {
      this.form.controls.email.markAsTouched();
      this.form.controls.password.markAsTouched();
      return;   // email válido + contraseña de 8+ requeridos para crear cuenta
    }

    // Si tiene horario propio, validar que cada tramo tenga fin posterior al inicio.
    if (this.customHours()) {
      for (const ranges of Object.values(this.weekly())) {
        for (const r of ranges) {
          if (r.start >= r.end) {
            this.scheduleError.set(`Tramo inválido (${r.start}–${r.end}): el fin debe ser posterior al inicio.`);
            return;
          }
        }
      }
    }
    this.scheduleError.set(null);

    const payload: SaveStaffPayload = {
      name:        v.name ?? '',
      color:       v.color || undefined,
      imageUrl:    this.photo() || undefined,
      active:      v.active ?? true,
      sortOrder:   v.sortOrder ?? 0,
      // userId solo si se eligió una cuenta existente (no "sin login" ni "crear nueva")
      userId:      newAccount || !v.userId ? undefined : v.userId,
      account:     newAccount ? { name: v.name ?? '', email: v.email ?? '', password: v.password ?? '' } : undefined,
      customHours: this.customHours(),
      weeklyHours: this.weekly(),
      blockedDates: this.blocked(),
      serviceIds:  this.serviceIds(),
    };
    const id = this.editingId();
    if (id) this.updated.emit({ id, payload });
    else    this.created.emit(payload);
    this.reset();
  }

  private isEmail(v: string | null | undefined): boolean {
    return !!v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  }

  /* ── Servicios que realiza ── */

  isServiceOn(id: string): boolean { return this.serviceIds().includes(id); }
  toggleService(id: string): void {
    this.serviceIds.update((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  }

  /* ── Horario propio (turnos por día) ── */

  setCustomHours(event: Event): void {
    this.customHours.set((event.target as HTMLInputElement).checked);
  }
  rangesOf(day: string): TimeRange[] { return this.weekly()[day] ?? []; }
  isOpen(day: string): boolean { return this.rangesOf(day).length > 0; }

  setDayOpen(day: string, event: Event): void {
    const open = (event.target as HTMLInputElement).checked;
    if (open) { if (this.rangesOf(day).length === 0) this.addRange(day); }
    else this.weekly.update((w) => { const n = { ...w }; delete n[day]; return n; });
  }
  addRange(day: string): void {
    this.weekly.update((w) => ({ ...w, [day]: [...(w[day] ?? []), { start: '09:00', end: '13:00' }] }));
  }
  removeRange(day: string, index: number): void {
    this.weekly.update((w) => {
      const n = { ...w };
      const list = (n[day] ?? []).filter((_, i) => i !== index);
      if (list.length) n[day] = list; else delete n[day];
      return n;
    });
  }
  setRange(day: string, index: number, field: 'start' | 'end', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.weekly.update((w) => {
      const n = { ...w };
      const list = [...(n[day] ?? [])];
      list[index] = { ...list[index], [field]: value };
      n[day] = list;
      return n;
    });
  }

  /* ── Vacaciones propias: las gestiona <lib-vacation-picker> vía la señal `blocked`. ── */
}
