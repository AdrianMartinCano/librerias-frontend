import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { FeaturesData } from '@org/models';

@Component({
  selector: 'lib-cms-features-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <label class="cms-field"><span>Subtítulo</span><input formControlName="subtitle" type="text" /></label>
      <label class="cms-field">
        <span>Columnas</span>
        <select formControlName="cols">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </label>
      <div formArrayName="items">
        @for (item of items.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Feature {{ i + 1 }}</legend>
            <label class="cms-field"><span>Icono (emoji o SVG)</span><input formControlName="icon" type="text" /></label>
            <label class="cms-field"><span>Título *</span><input formControlName="title" type="text" /></label>
            <label class="cms-field"><span>Texto *</span><textarea formControlName="text" rows="2"></textarea></label>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removeItem(i)">Eliminar</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addItem()">+ Añadir feature</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class FeaturesFormComponent implements OnInit {
  readonly initialData = input<Partial<FeaturesData>>({});
  readonly changed = output<FeaturesData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:    [d.title    ?? ''],
      subtitle: [d.subtitle ?? ''],
      cols:     [d.cols     ?? 3],
      items:    this.fb.array((d.items ?? []).map(i => this.buildItem(i))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildItem(i?: { icon?: string; title?: string; text?: string }): FormGroup {
    return this.fb.group({
      icon:  [i?.icon  ?? ''],
      title: [i?.title ?? '', Validators.required],
      text:  [i?.text  ?? '', Validators.required],
    });
  }

  addItem(): void { this.items.push(this.buildItem()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({ title: v.title || undefined, subtitle: v.subtitle || undefined, cols: Number(v.cols) as 2|3|4, items: v.items });
  }
}
