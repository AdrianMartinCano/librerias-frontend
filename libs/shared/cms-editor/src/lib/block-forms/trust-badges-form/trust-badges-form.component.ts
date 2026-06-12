import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { TrustBadgesData } from '@org/models';

@Component({
  selector: 'lib-cms-trust-badges-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <label class="cms-field">
        <span>Alineación</span>
        <select formControlName="align">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
        </select>
      </label>
      <div formArrayName="items">
        @for (item of items.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Badge {{ i + 1 }}</legend>
            <label class="cms-field"><span>Icono (emoji)</span><input formControlName="icon" type="text" /></label>
            <label class="cms-field"><span>Texto *</span><input formControlName="text" type="text" /></label>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removeItem(i)">Eliminar</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addItem()">+ Añadir badge</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class TrustBadgesFormComponent implements OnInit {
  readonly initialData = input<Partial<TrustBadgesData>>({});
  readonly changed = output<TrustBadgesData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title: [d.title ?? ''],
      align: [d.align ?? 'left'],
      items: this.fb.array((d.items ?? []).map(i => this.buildItem(i))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildItem(i?: { icon?: string; text?: string }): FormGroup {
    return this.fb.group({
      icon: [i?.icon ?? ''],
      text: [i?.text ?? '', Validators.required],
    });
  }

  addItem(): void { this.items.push(this.buildItem()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title: v.title || undefined,
      align: v.align as 'left' | 'center',
      items: v.items,
    });
  }
}
