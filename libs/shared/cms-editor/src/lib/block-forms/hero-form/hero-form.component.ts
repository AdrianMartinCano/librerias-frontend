import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { HeroData } from '@org/models';
import { CmsImageUploadComponent } from '../../image-upload/image-upload.component';

@Component({
  selector: 'lib-cms-hero-form',
  standalone: true,
  imports: [ReactiveFormsModule, CmsImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field">
        <span>Título *</span>
        <input formControlName="title" type="text" />
      </label>
      <label class="cms-field">
        <span>Subtítulo</span>
        <input formControlName="subtitle" type="text" />
      </label>
      <lib-cms-image-upload
        [initialUrl]="form.get('image')?.value"
        (uploaded)="form.patchValue({ image: $event })" />
      <label class="cms-field">
        <span>Alt imagen</span>
        <input formControlName="imageAlt" type="text" />
      </label>
      <label class="cms-field cms-field--row">
        <input formControlName="overlay" type="checkbox" />
        <span>Overlay oscuro sobre imagen</span>
      </label>
      <label class="cms-field">
        <span>Alineación</span>
        <select formControlName="align">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
        </select>
      </label>
      <label class="cms-field">
        <span>Altura mínima (ej. 60vh)</span>
        <input formControlName="minHeight" type="text" />
      </label>
      <fieldset class="cms-fieldset">
        <legend>CTA principal</legend>
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
          <input formControlName="ctaExternal" type="checkbox" />
          <span>Enlace externo</span>
        </label>
      </fieldset>
      <fieldset class="cms-fieldset">
        <legend>CTA secundario</legend>
        <label class="cms-field"><span>Texto</span><input formControlName="ctaSecLabel" type="text" /></label>
        <label class="cms-field"><span>URL</span><input formControlName="ctaSecHref" type="text" /></label>
        <label class="cms-field">
          <span>Estilo</span>
          <select formControlName="ctaSecVariant">
            <option value="outline">Outline</option>
            <option value="accent">Accent</option>
            <option value="primary">Primary</option>
          </select>
        </label>
        <label class="cms-field cms-field--row">
          <input formControlName="ctaSecExternal" type="checkbox" />
          <span>Enlace externo</span>
        </label>
      </fieldset>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class HeroFormComponent implements OnInit {
  readonly initialData = input<Partial<HeroData>>({});
  readonly changed = output<HeroData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:         [d.title ?? '', Validators.required],
      subtitle:      [d.subtitle ?? ''],
      image:         [d.image ?? ''],
      imageAlt:      [d.imageAlt ?? ''],
      overlay:       [d.overlay ?? false],
      align:         [d.align ?? 'left'],
      minHeight:     [d.minHeight ?? ''],
      ctaLabel:      [d.cta?.label ?? ''],
      ctaHref:       [d.cta?.href ?? ''],
      ctaVariant:    [d.cta?.variant ?? 'accent'],
      ctaExternal:   [d.cta?.external ?? false],
      ctaSecLabel:   [d.ctaSecondary?.label ?? ''],
      ctaSecHref:    [d.ctaSecondary?.href ?? ''],
      ctaSecVariant: [d.ctaSecondary?.variant ?? 'outline'],
      ctaSecExternal:[d.ctaSecondary?.external ?? false],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const data: HeroData = {
      title:    v.title,
      subtitle: v.subtitle || undefined,
      image:    v.image    || undefined,
      imageAlt: v.imageAlt || undefined,
      overlay:  v.overlay  || undefined,
      align:    v.align    || undefined,
      minHeight:v.minHeight || undefined,
      cta: v.ctaLabel ? { label: v.ctaLabel, href: v.ctaHref, variant: v.ctaVariant, external: v.ctaExternal } : undefined,
      ctaSecondary: v.ctaSecLabel ? { label: v.ctaSecLabel, href: v.ctaSecHref, variant: v.ctaSecVariant, external: v.ctaSecExternal } : undefined,
    };
    this.changed.emit(data);
  }

}
