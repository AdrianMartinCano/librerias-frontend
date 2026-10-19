import { Component, ChangeDetectionStrategy, input, output, inject, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DiningSettings } from '@org/models';

/**
 * Ajustes de reservas de restaurante: aforo total por turno (0 = sin tope), antelación mín/máx y días
 * cerrados (uno por línea). Componente controlado: el host pasa `settings` y persiste en `saved`.
 */
@Component({
  selector: 'lib-dining-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="lib-ds" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h3 class="lib-ds__title">Ajustes de reservas</h3>

      <div class="lib-ds__row">
        <div class="lib-field lib-ds__grow">
          <label class="lib-label" for="ds-cap">Aforo por turno</label>
          <input id="ds-cap" class="lib-input" type="number" min="0" formControlName="totalCapacity"
                 title="Máximo de comensales por turno. 0 = sin tope (manda la capacidad de cada mesa)." />
        </div>
        <div class="lib-field lib-ds__grow">
          <label class="lib-label" for="ds-max">Antelación máx. (días)</label>
          <input id="ds-max" class="lib-input" type="number" min="1" formControlName="maxAdvanceDays" />
        </div>
        <div class="lib-field lib-ds__grow">
          <label class="lib-label" for="ds-min">Antelación mín. (horas)</label>
          <input id="ds-min" class="lib-input" type="number" min="0" formControlName="minAdvanceHours" />
        </div>
      </div>
      <p class="lib-ds__hint">
        El <strong>aforo por turno</strong> limita el total de comensales sentados a la vez. Déjalo en
        <strong>0</strong> para no poner tope (entonces solo manda la capacidad de las mesas).
      </p>

      <div class="lib-field">
        <label class="lib-label" for="ds-blocked">Días cerrados (uno por línea, YYYY-MM-DD)</label>
        <textarea id="ds-blocked" class="lib-input lib-ds__area" rows="4" formControlName="blockedDates" placeholder="2026-12-25&#10;2026-01-01"></textarea>
      </div>

      <button type="submit" class="lib-ds__btn" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Guardando…' : 'Guardar ajustes' }}
      </button>
    </form>
  `,
  styles: [`
    .lib-ds { display: flex; flex-direction: column; gap: var(--space-3, .75rem); background: var(--color-background, #fff); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: var(--space-4, 1rem) var(--space-5, 1.25rem); max-width: 620px; }
    .lib-ds__title { font-size: var(--font-size-lg, 1.125rem); font-weight: 700; margin: 0; }
    .lib-ds__row { display: flex; gap: var(--space-3, .75rem); align-items: end; }
    .lib-ds__grow { flex: 1; }
    .lib-field { display: flex; flex-direction: column; gap: .35rem; }
    .lib-ds__hint { margin: 0; font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #909090); line-height: 1.4; }
    .lib-ds__area { font-family: var(--font-family-mono, monospace); }
    .lib-ds__btn { align-self: flex-start; padding: var(--space-3, .75rem) var(--space-5, 1.25rem); background: var(--color-accent, #ff4d4d); color: #fff; border: none; border-radius: var(--radius-md, .5rem); font-weight: 600; font-family: inherit; cursor: pointer; }
    .lib-ds__btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class DiningSettingsComponent {
  readonly settings = input<DiningSettings | null>(null);
  readonly loading  = input(false);

  readonly saved = output<DiningSettings>();

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    totalCapacity:   [0, [Validators.required, Validators.min(0)]],
    maxAdvanceDays:  [60, [Validators.required, Validators.min(1)]],
    minAdvanceHours: [1, [Validators.required, Validators.min(0)]],
    blockedDates:    [''],
  });

  constructor() {
    // Sincroniza el input en el formulario cuando el host carga/actualiza los ajustes.
    effect(() => {
      const s = this.settings();
      if (!s) return;
      this.form.reset({
        totalCapacity:   s.totalCapacity,
        maxAdvanceDays:  s.maxAdvanceDays,
        minAdvanceHours: s.minAdvanceHours,
        blockedDates:    (s.blockedDates ?? []).join('\n'),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const blockedDates = (v.blockedDates ?? '')
      .split(/[\n,]+/).map(d => d.trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    this.saved.emit({
      totalCapacity:   v.totalCapacity ?? 0,
      maxAdvanceDays:  v.maxAdvanceDays ?? 60,
      minAdvanceHours: v.minAdvanceHours ?? 1,
      blockedDates,
    });
  }
}
