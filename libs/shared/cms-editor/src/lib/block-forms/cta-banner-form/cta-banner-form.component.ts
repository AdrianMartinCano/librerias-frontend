import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { CtaBannerData } from '@org/models';

@Component({
  selector: 'lib-cms-cta-banner-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título *</span><input formControlName="title" type="text" /></label>
      <label class="cms-field"><span>Subtítulo</span><input formControlName="subtitle" type="text" /></label>
      <label class="cms-field">
        <span>Fondo</span>
        <select formControlName="background">
          <option value="primary">Primary</option>
          <option value="accent">Accent</option>
          <option value="surface">Surface</option>
        </select>
      </label>
      <fieldset class="cms-fieldset">
        <legend>CTA principal *</legend>
        <label class="cms-field"><span>Texto</span><input formControlName="ctaLabel" type="text" /></label>
        <label class="cms-field"><span>URL</span><input formControlName="ctaHref" type="text" /></label>
        <label class="cms-field">
          <span>Estilo</span>
          <select formControlName="ctaVariant">
            <option value="accent">Accent</option>
            <option value="primary">Primary</option>
            <option value="outline">Outline</option>
          </select>
        </label>
        <label class="cms-field cms-field--row">
          <input formControlName="ctaExternal" type="checkbox" /><span>Enlace externo</span>
        </label>
      </fieldset>
      <fieldset class="cms-fieldset">
        <legend>CTA secundario</legend>
        <label class="cms-field"><span>Texto</span><input formControlName="ctaSecLabel" type="text" /></label>
        <label class="cms-field"><span>URL</span><input formControlName="ctaSecHref" type="text" /></label>
        <label class="cms-field cms-field--row">
          <input formControlName="ctaSecExternal" type="checkbox" /><span>Enlace externo</span>
        </label>
      </fieldset>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class CtaBannerFormComponent implements OnInit {
  readonly initialData = input<Partial<CtaBannerData>>({});
  readonly changed = output<CtaBannerData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:         [d.title      ?? '', Validators.required],
      subtitle:      [d.subtitle   ?? ''],
      background:    [d.background ?? 'primary'],
      ctaLabel:      [d.cta?.label ?? '', Validators.required],
      ctaHref:       [d.cta?.href  ?? '', Validators.required],
      ctaVariant:    [d.cta?.variant    ?? 'accent'],
      ctaExternal:   [d.cta?.external   ?? false],
      ctaSecLabel:   [d.ctaSecondary?.label   ?? ''],
      ctaSecHref:    [d.ctaSecondary?.href    ?? ''],
      ctaSecExternal:[d.ctaSecondary?.external ?? false],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title:       v.title,
      subtitle:    v.subtitle    || undefined,
      background:  v.background  || undefined,
      cta:         { label: v.ctaLabel, href: v.ctaHref, variant: v.ctaVariant, external: v.ctaExternal },
      ctaSecondary: v.ctaSecLabel ? { label: v.ctaSecLabel, href: v.ctaSecHref, external: v.ctaSecExternal } : undefined,
    });
  }
}
