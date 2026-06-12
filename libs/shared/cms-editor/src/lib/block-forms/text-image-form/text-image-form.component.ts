import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { TextImageData } from '@org/models';
import { CmsImageUploadComponent } from '../../image-upload/image-upload.component';

@Component({
  selector: 'lib-cms-text-image-form',
  standalone: true,
  imports: [ReactiveFormsModule, CmsImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field">
        <span>Título</span>
        <input formControlName="title" type="text" />
      </label>
      <label class="cms-field">
        <span>Texto *</span>
        <textarea formControlName="text" rows="4"></textarea>
      </label>
      <lib-cms-image-upload
        [initialUrl]="form.get('image')?.value"
        (uploaded)="form.patchValue({ image: $event })" />
      <label class="cms-field">
        <span>Alt imagen</span>
        <input formControlName="imageAlt" type="text" />
      </label>
      <label class="cms-field">
        <span>Posición imagen</span>
        <select formControlName="imagePosition">
          <option value="right">Derecha</option>
          <option value="left">Izquierda</option>
        </select>
      </label>
      <fieldset class="cms-fieldset">
        <legend>CTA</legend>
        <label class="cms-field"><span>Texto</span><input formControlName="ctaLabel" type="text" /></label>
        <label class="cms-field"><span>URL</span><input formControlName="ctaHref" type="text" /></label>
        <label class="cms-field cms-field--row">
          <input formControlName="ctaExternal" type="checkbox" />
          <span>Enlace externo</span>
        </label>
      </fieldset>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class TextImageFormComponent implements OnInit {
  readonly initialData = input<Partial<TextImageData>>({});
  readonly changed = output<TextImageData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:         [d.title ?? ''],
      text:          [d.text  ?? '', Validators.required],
      image:         [d.image ?? '', Validators.required],
      imageAlt:      [d.imageAlt ?? ''],
      imagePosition: [d.imagePosition ?? 'right'],
      ctaLabel:      [d.cta?.label ?? ''],
      ctaHref:       [d.cta?.href  ?? ''],
      ctaExternal:   [d.cta?.external ?? false],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title:         v.title         || undefined,
      text:          v.text,
      image:         v.image,
      imageAlt:      v.imageAlt      || undefined,
      imagePosition: v.imagePosition || undefined,
      cta: v.ctaLabel ? { label: v.ctaLabel, href: v.ctaHref, external: v.ctaExternal } : undefined,
    });
  }
}
