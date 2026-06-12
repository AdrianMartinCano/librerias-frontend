import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { CountersData } from '@org/models';

@Component({
  selector: 'lib-cms-counters-form',
  standalone: true,
  imports: [ReactiveFormsModule],
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
      <div formArrayName="items">
        @for (item of items.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Contador {{ i + 1 }}</legend>
            <label class="cms-field"><span>Valor *</span><input formControlName="value" type="number" /></label>
            <label class="cms-field"><span>Etiqueta *</span><input formControlName="label" type="text" /></label>
            <label class="cms-field"><span>Prefijo (ej. $)</span><input formControlName="prefix" type="text" /></label>
            <label class="cms-field"><span>Sufijo (ej. +, %, h)</span><input formControlName="suffix" type="text" /></label>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removeItem(i)">Eliminar</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addItem()">+ Añadir contador</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class CountersFormComponent implements OnInit {
  readonly initialData = input<Partial<CountersData>>({});
  readonly changed = output<CountersData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title: [d.title ?? ''],
      cols:  [d.cols  ?? 4],
      items: this.fb.array((d.items ?? []).map(i => this.buildItem(i))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildItem(i?: { value?: number; label?: string; prefix?: string; suffix?: string }): FormGroup {
    return this.fb.group({
      value:  [i?.value  ?? 0,  Validators.required],
      label:  [i?.label  ?? '', Validators.required],
      prefix: [i?.prefix ?? ''],
      suffix: [i?.suffix ?? ''],
    });
  }

  addItem(): void { this.items.push(this.buildItem()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title: v.title || undefined,
      cols:  Number(v.cols) as 2 | 3 | 4,
      items: v.items.map((item: any) => ({
        value:  Number(item.value),
        label:  item.label,
        prefix: item.prefix || undefined,
        suffix: item.suffix || undefined,
      })),
    });
  }
}
