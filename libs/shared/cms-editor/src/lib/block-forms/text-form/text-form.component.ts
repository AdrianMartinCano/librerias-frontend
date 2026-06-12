import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { TextData } from '@org/models';

@Component({
  selector: 'lib-cms-text-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field">
        <span>Contenido * (HTML básico permitido)</span>
        <textarea formControlName="content" rows="6"></textarea>
      </label>
      <label class="cms-field">
        <span>Alineación</span>
        <select formControlName="align">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </label>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class TextFormComponent implements OnInit {
  readonly initialData = input<Partial<TextData>>({});
  readonly changed = output<TextData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      content: [d.content ?? '', Validators.required],
      align:   [d.align   ?? 'left'],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({ content: v.content, align: v.align });
  }
}
