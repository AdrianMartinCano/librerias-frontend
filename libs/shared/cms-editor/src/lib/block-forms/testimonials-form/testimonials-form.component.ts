import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { TestimonialsData } from '@org/models';

@Component({
  selector: 'lib-cms-testimonials-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field"><span>Título</span><input formControlName="title" type="text" /></label>
      <div formArrayName="items">
        @for (item of items.controls; track $index; let i = $index) {
          <fieldset class="cms-fieldset" [formGroupName]="i">
            <legend>Testimonio {{ i + 1 }}</legend>
            <label class="cms-field"><span>Texto *</span><textarea formControlName="text" rows="3"></textarea></label>
            <label class="cms-field"><span>Autor *</span><input formControlName="author" type="text" /></label>
            <label class="cms-field"><span>Cargo/rol</span><input formControlName="role" type="text" /></label>
            <label class="cms-field"><span>Avatar URL</span><input formControlName="avatar" type="text" /></label>
            <label class="cms-field"><span>Valoración (1-5)</span><input formControlName="rating" type="number" min="1" max="5" /></label>
            <button type="button" class="cms-btn cms-btn--danger" (click)="removeItem(i)">Eliminar</button>
          </fieldset>
        }
      </div>
      <button type="button" class="cms-btn cms-btn--secondary" (click)="addItem()">+ Añadir testimonio</button>
      <button type="submit" class="cms-btn cms-btn--primary" [disabled]="form.invalid">Aplicar</button>
    </form>
  `,
})
export class TestimonialsFormComponent implements OnInit {
  readonly initialData = input<Partial<TestimonialsData>>({});
  readonly changed = output<TestimonialsData>();

  form!: FormGroup;
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title: [d.title ?? ''],
      items: this.fb.array((d.items ?? []).map(i => this.buildItem(i))),
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.valid) this.submit(); });
  }

  private buildItem(i?: { text?: string; author?: string; role?: string; avatar?: string; rating?: number }): FormGroup {
    return this.fb.group({
      text:   [i?.text   ?? '', Validators.required],
      author: [i?.author ?? '', Validators.required],
      role:   [i?.role   ?? ''],
      avatar: [i?.avatar ?? ''],
      rating: [i?.rating ?? null],
    });
  }

  addItem(): void { this.items.push(this.buildItem()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.changed.emit({
      title: v.title || undefined,
      items: v.items.map((i: { text: string; author: string; role: string; avatar: string; rating: number | null }) => ({
        text:   i.text,
        author: i.author,
        role:   i.role   || undefined,
        avatar: i.avatar || undefined,
        rating: i.rating ?? undefined,
      })),
    });
  }
}
