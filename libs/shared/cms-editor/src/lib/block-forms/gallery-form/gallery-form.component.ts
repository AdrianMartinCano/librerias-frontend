import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { GalleryData } from '@org/models';
import { CmsImageUploadComponent } from '../../image-upload/image-upload.component';

@Component({
  selector: 'lib-cms-gallery-form',
  standalone: true,
  imports: [ReactiveFormsModule, CmsImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <label class="cms-field">
        <span>Columnas</span>
        <select formControlName="cols">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </label>
      <div formArrayName="images">
        @for (img of images.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Imagen {{ i + 1 }}</legend>
            <lib-cms-image-upload
              [initialUrl]="img.get('src')?.value"
              (uploaded)="patchSrc(i, $event)" />
            <label class="cms-field"><span>Alt</span><input formControlName="alt" type="text" /></label>
            <label class="cms-field"><span>Leyenda</span><input formControlName="caption" type="text" /></label>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removeImage(i)">Eliminar</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addImage()">+ Añadir imagen</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class GalleryFormComponent implements OnInit {
  readonly initialData = input<Partial<GalleryData>>({});
  readonly changed = output<GalleryData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get images(): FormArray { return this.form.get('images') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:  [d.title ?? ''],
      cols:   [d.cols  ?? 3],
      images: this.fb.array((d.images ?? []).map(i => this.buildImage(i))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildImage(i?: { src?: string; alt?: string; caption?: string }): FormGroup {
    return this.fb.group({
      src:     [i?.src     ?? '', Validators.required],
      alt:     [i?.alt     ?? ''],
      caption: [i?.caption ?? ''],
    });
  }

  addImage(): void { this.images.push(this.buildImage()); }
  removeImage(i: number): void { this.images.removeAt(i); }
  patchSrc(i: number, url: string): void { this.images.at(i).patchValue({ src: url }); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({ title: v.title || undefined, cols: Number(v.cols) as 2|3|4, images: v.images });
  }
}
