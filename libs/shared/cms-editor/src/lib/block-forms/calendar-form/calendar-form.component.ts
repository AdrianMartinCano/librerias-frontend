import { Component, ChangeDetectionStrategy, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { CalendarBlockData } from '@org/models';

@Component({
  selector: 'lib-cms-calendar-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="cms-block-form" (ngSubmit)="submit()">
      <label class="cms-field">
        <span>Título</span>
        <input formControlName="title" type="text" placeholder="Disponibilidad" />
      </label>
      <label class="cms-field">
        <span>Endpoint de ocupación <small>(API que devuelve las franjas ocupadas)</small></span>
        <input formControlName="busyEndpoint" type="text" placeholder="/api/busy" />
      </label>
      <label class="cms-field">
        <span>Meses a mostrar</span>
        <input formControlName="monthsAhead" type="number" min="1" max="12" />
      </label>
      <button type="submit" class="cms-btn cms-btn--primary">Aplicar</button>
    </form>
  `,
})
export class CalendarFormComponent implements OnInit {
  readonly initialData = input<Partial<CalendarBlockData>>({});
  readonly changed = output<CalendarBlockData>();

  form!: FormGroup;
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  ngOnInit(): void {
    const d = this.initialData();
    this.form = this.fb.group({
      title:        [d.title ?? ''],
      busyEndpoint: [d.busyEndpoint ?? '/api/busy'],
      monthsAhead:  [d.monthsAhead ?? 2],
    });
    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.submit());
  }

  submit(): void {
    const v = this.form.value;
    this.changed.emit({
      title:        v.title || undefined,
      busyEndpoint: v.busyEndpoint || undefined,
      monthsAhead:  v.monthsAhead ?? undefined,
    });
  }
}
