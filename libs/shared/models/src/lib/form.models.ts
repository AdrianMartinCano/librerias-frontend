import type { ValidatorFn } from '@angular/forms';

export type FormFieldType =
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  defaultValue?: unknown;
  options?: SelectOption[];
  rows?: number;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  span?: 1 | 2;

  /**
   * Validadores de Angular (built-in o propios). Se aplican además de los campos declarativos.
   * @example
   * import { Validators } from '@angular/forms';
   * validators: [Validators.maxLength(40), miValidadorPersonalizado]
   */
  validators?: ValidatorFn[];

  /**
   * Validador simple sin depender de Angular.
   * Devuelve null si es válido, o el mensaje de error como string.
   * @example
   * validate: v => (v as string).includes('@empresa.com') ? null : 'Solo emails corporativos'
   */
  validate?: (value: unknown) => string | null;
}
