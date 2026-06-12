import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { PricingData } from '@org/models';

@Component({
  selector: 'lib-cms-pricing-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <label class="cms-field"><span>Subtítulo</span><input formControlName="subtitle" type="text" /></label>
      <div formArrayName="plans">
        @for (plan of plans.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Plan {{ i + 1 }}</legend>
            <label class="cms-field"><span>Nombre *</span><input formControlName="name" type="text" /></label>
            <label class="cms-field"><span>Precio *</span><input formControlName="price" type="text" /></label>
            <label class="cms-field"><span>Periodo (ej. mes)</span><input formControlName="period" type="text" /></label>
            <label class="cms-field"><span>Descripción</span><input formControlName="description" type="text" /></label>
            <label class="cms-field"><span>Badge (ej. Más popular)</span><input formControlName="badge" type="text" /></label>
            <label class="cms-field cms-field--row">
              <input formControlName="highlighted" type="checkbox" /><span>Destacado</span>
            </label>
            <label class="cms-field">
              <span>Características (una por línea)</span>
              <textarea formControlName="features" rows="4"></textarea>
            </label>
            <fieldset class="cms-fieldset">
              <legend>CTA</legend>
              <label class="cms-field"><span>Texto</span><input formControlName="ctaLabel" type="text" /></label>
              <label class="cms-field"><span>URL</span><input formControlName="ctaHref" type="text" /></label>
            </fieldset>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removePlan(i)">Eliminar plan</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addPlan()">+ Añadir plan</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class PricingFormComponent implements OnInit {
  readonly initialData = input<Partial<PricingData>>({});
  readonly changed = output<PricingData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get plans(): FormArray { return this.form.get('plans') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:    [d.title    ?? ''],
      subtitle: [d.subtitle ?? ''],
      plans:    this.fb.array((d.plans ?? []).map(p => this.buildPlan(p))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildPlan(p?: Partial<PricingData['plans'][0]>): FormGroup {
    return this.fb.group({
      name:        [p?.name        ?? '', Validators.required],
      price:       [p?.price       ?? '', Validators.required],
      period:      [p?.period      ?? ''],
      description: [p?.description ?? ''],
      badge:       [p?.badge       ?? ''],
      highlighted: [p?.highlighted ?? false],
      features:    [(p?.features   ?? []).join('\n')],
      ctaLabel:    [p?.cta?.label  ?? ''],
      ctaHref:     [p?.cta?.href   ?? ''],
    });
  }

  addPlan(): void { this.plans.push(this.buildPlan()); }
  removePlan(i: number): void { this.plans.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title:    v.title    || undefined,
      subtitle: v.subtitle || undefined,
      plans: v.plans.map((p: { name: string; price: string; period: string; description: string; badge: string; highlighted: boolean; features: string; ctaLabel: string; ctaHref: string }) => ({
        name:        p.name,
        price:       p.price,
        period:      p.period      || undefined,
        description: p.description || undefined,
        badge:       p.badge       || undefined,
        highlighted: p.highlighted || undefined,
        features:    p.features.split('\n').map((f: string) => f.trim()).filter(Boolean),
        cta:         p.ctaLabel ? { label: p.ctaLabel, href: p.ctaHref } : undefined,
      })),
    });
  }
}
