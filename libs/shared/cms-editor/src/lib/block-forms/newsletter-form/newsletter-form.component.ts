import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { NewsletterBlockData } from '@org/models';

@Component({
  selector: 'lib-cms-newsletter-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <label class="cms-field">
        <span>Descripción</span>
        <textarea formControlName="description" rows="2"></textarea>
      </label>
      <label class="cms-field">
        <span>Diseño</span>
        <select formControlName="layout">
          <option value="inline">En línea</option>
          <option value="stacked">Apilado</option>
        </select>
      </label>
      <label class="cms-field">
        <span>Fondo</span>
        <select formControlName="background">
          <option value="surface">Surface</option>
          <option value="primary">Primary</option>
          <option value="accent">Accent</option>
        </select>
      </label>
      <label class="cms-field">
        <span>Alineación</span>
        <select formControlName="align">
          <option value="center">Centro</option>
          <option value="left">Izquierda</option>
        </select>
      </label>
      <label class="cms-field">
        <span>Origen (analítica)</span>
        <input formControlName="source" type="text" placeholder="home, footer..." />
      </label>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class NewsletterBlockFormComponent implements OnInit {
  readonly initialData = input<Partial<NewsletterBlockData>>({});
  readonly changed = output<NewsletterBlockData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:       [d.title       ?? ''],
      description: [d.description ?? ''],
      layout:      [d.layout      ?? 'inline'],
      background:  [d.background  ?? 'surface'],
      align:       [d.align       ?? 'center'],
      source:      [d.source      ?? ''],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title:       v.title       || undefined,
      description: v.description || undefined,
      layout:      v.layout,
      background:  v.background,
      align:       v.align,
      source:      v.source      || undefined,
    });
  }
}
