import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  input,
  output,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { FormField, FormFieldType } from '@org/models';

const NATIVE_INPUT_TYPES: FormFieldType[] = [
  'text', 'email', 'password', 'number', 'tel', 'url', 'date', 'file',
];

@Component({
  selector: 'lib-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.css',
})
export class DynamicFormComponent implements OnInit {
  readonly fields      = input.required<FormField[]>();
  readonly submitLabel = input('Enviar');
  readonly cancelLabel = input('');
  readonly loading     = input(false);
  readonly cols        = input<1 | 2>(1);

  readonly submitted  = output<Record<string, unknown>>();
  readonly cancelled  = output<void>();
  readonly formChange = output<Record<string, unknown>>();

  form!: FormGroup;

  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.buildForm();
  }

  isNativeInput(type: FormFieldType): boolean {
    return NATIVE_INPUT_TYPES.includes(type);
  }

  private buildForm(): void {
    const controls: Record<string, unknown> = {};

    for (const field of this.fields()) {
      const validators: ValidatorFn[] = [];

      // ── Validadores declarativos (de los props del campo) ──
      if (field.required)  validators.push(Validators.required);
      if (field.minLength) validators.push(Validators.minLength(field.minLength));
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
      if (field.pattern)   validators.push(Validators.pattern(field.pattern));
      if (field.type === 'email') validators.push(Validators.email);
      if (field.min != null && field.type === 'number') validators.push(Validators.min(Number(field.min)));
      if (field.max != null && field.type === 'number') validators.push(Validators.max(Number(field.max)));

      // ── Validadores Angular pasados directamente ──
      if (field.validators?.length) {
        validators.push(...field.validators);
      }

      // ── Validador simple (value => string | null) ──
      if (field.validate) {
        const fn = field.validate;
        validators.push((ctrl: AbstractControl): ValidationErrors | null => {
          const msg = fn(ctrl.value);
          return msg ? { custom: msg } : null;
        });
      }

      const defaultValue = field.defaultValue ?? (field.type === 'checkbox' ? false : '');
      controls[field.key] = [{ value: defaultValue, disabled: field.disabled ?? false }, validators];
    }

    this.form = this.fb.group(controls);

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.formChange.emit(val as Record<string, unknown>));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue() as Record<string, unknown>);
  }

  hasError(key: string): boolean {
    const ctrl = this.form?.get(key);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: FormField): string {
    const ctrl = this.form?.get(field.key);
    if (!ctrl?.errors) return '';
    const e = ctrl.errors;

    // Mensajes de validadores declarativos y built-in
    if (e['custom'])    return e['custom'] as string;
    if (e['required'])  return `${field.label} es obligatorio`;
    if (e['email'])     return 'El formato de email no es válido';
    if (e['minlength']) return `Mínimo ${(e['minlength'] as { requiredLength: number }).requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${(e['maxlength'] as { requiredLength: number }).requiredLength} caracteres`;
    if (e['min'])       return `El valor mínimo es ${(e['min'] as { min: number }).min}`;
    if (e['max'])       return `El valor máximo es ${(e['max'] as { max: number }).max}`;
    if (e['pattern'])   return field.patternMessage ?? 'El formato no es válido';

    // Validadores personalizados con { message: '...' } o string directo
    for (const val of Object.values(e)) {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && 'message' in val) return String((val as { message: unknown }).message);
    }

    return 'Campo no válido';
  }
}
