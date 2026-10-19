import { Component, ChangeDetectionStrategy, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FontChoice, MenuLayout, MenuPresentation } from '@org/models';
import { FONT_STACK } from '../menu-format';

const FONTS = Object.keys(FONT_STACK) as FontChoice[];
const LAYOUTS: MenuLayout[] = ['LIST', 'CARDS', 'COLUMNS'];

/**
 * Editor de la presentación de la carta: fuente de títulos y de cuerpo (whitelist), color de acento,
 * layout y opciones (precios/alérgenos/moneda), con **previsualización en vivo**. Controlado: el host
 * pasa `presentation` (GET) y persiste en `saved` (PUT /api/admin/menu/presentation).
 */
@Component({
  selector: 'lib-menu-style-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-sp">
      <form class="lib-sp__form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h3 class="lib-sp__title">Estilo de la carta</h3>

        <div class="lib-sp__row">
          <div class="lib-field lib-sp__grow">
            <label class="lib-label" for="sp-h">Fuente de títulos</label>
            <select id="sp-h" class="lib-input" formControlName="headingFont">
              @for (f of fonts; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>
          <div class="lib-field lib-sp__grow">
            <label class="lib-label" for="sp-b">Fuente del cuerpo</label>
            <select id="sp-b" class="lib-input" formControlName="bodyFont">
              @for (f of fonts; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>
        </div>

        <div class="lib-sp__row">
          <div class="lib-field">
            <label class="lib-label" for="sp-color">Acento</label>
            <input id="sp-color" class="lib-input lib-sp__color" type="color" formControlName="accentColor" />
          </div>
          <div class="lib-field lib-sp__grow">
            <label class="lib-label" for="sp-layout">Disposición</label>
            <select id="sp-layout" class="lib-input" formControlName="layout">
              @for (l of layouts; track l) { <option [value]="l">{{ l }}</option> }
            </select>
          </div>
          <div class="lib-field">
            <label class="lib-label" for="sp-cur">Moneda</label>
            <input id="sp-cur" class="lib-input lib-sp__cur" type="text" formControlName="currency" maxlength="3" />
          </div>
        </div>

        <div class="lib-sp__flags">
          <label class="lib-sp__flag"><input type="checkbox" formControlName="showPrices" /> Mostrar precios</label>
          <label class="lib-sp__flag"><input type="checkbox" formControlName="showAllergens" /> Mostrar alérgenos</label>
        </div>

        <button type="submit" class="lib-sp__btn" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Guardando…' : 'Guardar estilo' }}
        </button>
      </form>

      <aside class="lib-sp__preview" [style.--menu-accent]="accent()">
        <span class="lib-sp__preview-tag">Vista previa</span>
        <h4 class="lib-sp__pv-cat" [style.font-family]="headingStack()">Entrantes</h4>
        <div class="lib-sp__pv-item" [style.font-family]="bodyStack()">
          <div class="lib-sp__pv-head">
            <span>Croquetas caseras 🌱</span>
            <span>8,50 €</span>
          </div>
          <p class="lib-sp__pv-desc">De jamón ibérico, crujientes por fuera.</p>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .lib-sp { display: grid; gap: var(--space-5, 1.25rem); }
    @media (min-width: 820px) { .lib-sp { grid-template-columns: 1fr minmax(260px, .8fr); align-items: start; } }
    .lib-sp__form { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); display: flex; flex-direction: column; gap: var(--space-3, .75rem); }
    .lib-sp__title { margin: 0; font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-sp__row { display: flex; gap: var(--space-3, .75rem); align-items: flex-end; }
    .lib-sp__grow { flex: 1; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-sp__color { padding: 2px; height: 38px; width: 56px; }
    .lib-sp__cur { width: 72px; text-transform: uppercase; }
    .lib-sp__flags { display: flex; gap: var(--space-4, 1rem); }
    .lib-sp__flag { display: flex; align-items: center; gap: .35rem; font-size: var(--font-size-sm, .875rem); }
    .lib-sp__btn { align-self: flex-start; padding: var(--space-3, .75rem) var(--space-5, 1.25rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-sp__btn:disabled { opacity: .5; cursor: not-allowed; }

    .lib-sp__preview { border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-5, 1.25rem); background: var(--color-surface, #fafafa); }
    .lib-sp__preview-tag { font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); text-transform: uppercase; letter-spacing: .05em; }
    .lib-sp__pv-cat { color: var(--menu-accent, #8a5a2b); border-bottom: 2px solid var(--menu-accent, #8a5a2b); padding-bottom: .25rem; margin: var(--space-3, .75rem) 0; }
    .lib-sp__pv-head { display: flex; justify-content: space-between; font-weight: 500; }
    .lib-sp__pv-desc { color: var(--color-text-secondary, #595959); font-size: var(--font-size-sm, .875rem); margin: .15rem 0 0; }
  `],
})
export class MenuStylePickerComponent {
  readonly presentation = input<MenuPresentation | null>(null);
  readonly loading      = input(false);

  readonly saved = output<MenuPresentation>();

  readonly fonts = FONTS;
  readonly layouts = LAYOUTS;

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    headingFont:   ['SERIF' as FontChoice, Validators.required],
    bodyFont:      ['SANS' as FontChoice, Validators.required],
    accentColor:   ['#8a5a2b', Validators.required],
    layout:        ['LIST' as MenuLayout, Validators.required],
    currency:      ['EUR', Validators.required],
    showPrices:    [true],
    showAllergens: [true],
  });

  // Valor reactivo del formulario para la previsualización en vivo.
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly headingStack = computed(() => FONT_STACK[(this.value().headingFont ?? 'SERIF') as FontChoice]);
  readonly bodyStack    = computed(() => FONT_STACK[(this.value().bodyFont ?? 'SANS') as FontChoice]);
  readonly accent       = computed(() => this.value().accentColor ?? '#8a5a2b');

  constructor() {
    effect(() => {
      const p = this.presentation();
      if (!p) return;
      this.form.reset({
        headingFont: p.headingFont, bodyFont: p.bodyFont, accentColor: p.accentColor,
        layout: p.layout, currency: p.currency, showPrices: p.showPrices, showAllergens: p.showAllergens,
      });
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saved.emit({
      headingFont:   v.headingFont ?? 'SERIF',
      bodyFont:      v.bodyFont ?? 'SANS',
      accentColor:   v.accentColor ?? '#8a5a2b',
      layout:        v.layout ?? 'LIST',
      currency:      (v.currency ?? 'EUR').toUpperCase(),
      showPrices:    v.showPrices ?? true,
      showAllergens: v.showAllergens ?? true,
    });
  }
}
