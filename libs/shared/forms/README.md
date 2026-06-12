# @adrianmartincano/ng-forms

Formularios dinámicos para Angular: defines los campos como un array de objetos (FormField[]) y lib-form genera el formulario completo con validación, mensajes de error y estado de envío. Sin tocar HTML.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-forms
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=0.0.1` |

---

> Asegúrate de tener cargado el theme en tu `styles.css` global — los componentes usan sus variables CSS:
>
> ```css
> @import '@adrianmartincano/ng-theme/index.css';
> ```

---

## lib-form

Formulario dinámico generado desde un array de campos. Usa Angular Reactive Forms internamente.

**Importar desde `@adrianmartincano/ng-forms`** (librería separada):
```typescript
import { DynamicFormComponent } from '@adrianmartincano/ng-forms';
import { FormField, SelectOption } from '@adrianmartincano/ng-models';
```

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `fields` | `FormField[]` | — (obligatorio) | Definición de los campos |
| `cols` | `1 \| 2` | `1` | Columnas del grid. En móvil siempre colapsa a 1 |
| `submitLabel` | `string` | `'Enviar'` | Texto del botón de envío |
| `cancelLabel` | `string` | `''` | Texto del botón cancelar. Si está vacío, no se muestra |
| `loading` | `boolean` | `false` | Muestra spinner y deshabilita el botón de envío |

### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `submitted` | `Record<string, unknown>` | Emite los valores del formulario cuando es válido y se envía |
| `cancelled` | `void` | Emite al pulsar el botón cancelar |
| `formChange` | `Record<string, unknown>` | Emite en cada cambio de cualquier campo |

### Interfaz FormField

```typescript
interface FormField {
  key: string;               // nombre del campo en el objeto resultado
  label: string;             // etiqueta visible
  type: FormFieldType;       // tipo de input
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;             // texto de ayuda bajo el input
  defaultValue?: unknown;    // valor inicial
  options?: SelectOption[];  // para type: 'select' | 'radio'
  rows?: number;             // para type: 'textarea'
  min?: number | string;     // para type: 'number' | 'date'
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;          // regex de validación
  patternMessage?: string;   // mensaje de error personalizado para pattern
  span?: 1 | 2;             // columnas que ocupa (2 = ancho completo)
}

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}
```

### Tipos de campo (`FormFieldType`)

| Tipo | Renderiza | Validaciones automáticas |
|---|---|---|
| `text` | `<input type="text">` | required, minLength, maxLength, pattern |
| `email` | `<input type="email">` | required, formato email |
| `password` | `<input type="password">` | required, minLength, maxLength |
| `number` | `<input type="number">` | required, min, max |
| `tel` | `<input type="tel">` | required, pattern |
| `url` | `<input type="url">` | required |
| `date` | `<input type="date">` | required, min, max |
| `file` | `<input type="file">` | required |
| `textarea` | `<textarea>` | required, minLength, maxLength |
| `select` | `<select>` con `options` | required |
| `radio` | Grupo de `<input type="radio">` con `options` | required |
| `checkbox` | `<input type="checkbox">` | required (debe estar marcado) |

### Ejemplos

**Formulario de contacto sencillo:**
```typescript
campos: FormField[] = [
  { key: 'nombre',   label: 'Nombre',   type: 'text',     required: true },
  { key: 'email',    label: 'Email',    type: 'email',    required: true },
  { key: 'mensaje',  label: 'Mensaje',  type: 'textarea', required: true,
    minLength: 10, hint: 'Mínimo 10 caracteres', rows: 5 },
];
```
```html
<lib-form
  [fields]="campos"
  submitLabel="Enviar"
  (submitted)="onSubmit($event)"
/>
```

**Formulario en 2 columnas con select, radio y checkbox:**
```typescript
campos: FormField[] = [
  { key: 'nombre',    label: 'Nombre',    type: 'text',   required: true },
  { key: 'telefono',  label: 'Teléfono',  type: 'tel',    required: true },
  { key: 'categoria', label: 'Categoría', type: 'select', required: true,
    placeholder: 'Elige una categoría',
    options: [
      { value: 'A', label: 'Opción A' },
      { value: 'B', label: 'Opción B' },
    ],
  },
  { key: 'fecha',     label: 'Fecha',     type: 'date',   required: true },
  { key: 'tipo',      label: 'Tipo',      type: 'radio',  required: true, span: 2,
    options: [
      { value: 'basico',   label: 'Básico' },
      { value: 'premium',  label: 'Premium' },
    ],
  },
  { key: 'terminos',  label: 'Acepto los términos y condiciones',
    type: 'checkbox', required: true, span: 2 },
];
```
```html
<lib-form
  [fields]="campos"
  [cols]="2"
  submitLabel="Confirmar"
  cancelLabel="Volver"
  [loading]="enviando"
  (submitted)="onSubmit($event)"
  (cancelled)="volver()"
/>
```

**Recibir y usar los datos:**
```typescript
onSubmit(data: Record<string, unknown>): void {
  // data = { nombre: 'Ana', email: 'ana@mail.com', mensaje: '...' }
  this.miServicio.enviar(data).subscribe(...);
}
```

**Campo con valor por defecto y deshabilitado:**
```typescript
{ key: 'pais', label: 'País', type: 'select',
  defaultValue: 'ES',
  options: [{ value: 'ES', label: 'España' }, { value: 'FR', label: 'Francia' }],
},
{ key: 'referencia', label: 'Referencia', type: 'text',
  defaultValue: 'REF-2025-001', disabled: true },
```

### Validaciones y mensajes de error

Los mensajes de error se generan automáticamente en español:

| Validación | Mensaje |
|---|---|
| `required` | `{label} es obligatorio` |
| `email` | `El formato de email no es válido` |
| `minLength` | `Mínimo {n} caracteres` |
| `maxLength` | `Máximo {n} caracteres` |
| `min` | `El valor mínimo es {n}` |
| `max` | `El valor máximo es {n}` |
| `pattern` | `{patternMessage}` o `El formato no es válido` |
| `validators` personalizados | El mensaje que devuelva el validador |

Los errores solo se muestran después de que el usuario haya tocado el campo. Al intentar enviar un formulario inválido, todos los campos se marcan como tocados y los errores aparecen.

---

### Validadores personalizados con `validators`

Además de los campos declarativos (`required`, `minLength`...), puedes pasar un array de `ValidatorFn` de Angular. Esto permite reutilizar validators propios en cualquier campo.

**Definir el validador** (fuera del componente, para que sea reutilizable):

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';

// El validador devuelve null si es válido,
// o un objeto con clave 'message' para que lib-form muestre ese texto.
function soloLetrasValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = String(ctrl.value ?? '');
  if (!value) return null;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)
    ? null
    : { message: 'Solo se permiten letras' };
}

function maxNumerosYLetrasValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = String(ctrl.value ?? '');
  if (!value) return null;

  const numeros = (value.match(/\d/g) ?? []).length;
  const letras  = (value.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) ?? []).length;
  const otros   = value.length - numeros - letras;

  if (otros > 0)   return { message: 'Solo se permiten letras y números' };
  if (numeros > 3) return { message: `Máximo 3 números (tienes ${numeros})` };
  if (letras > 10) return { message: `Máximo 10 letras (tienes ${letras})` };

  return null;
}
```

**Usar el validador en el campo:**

```typescript
import { Validators } from '@angular/forms';
import { FormField } from '@adrianmartincano/ng-models';

campos: FormField[] = [
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    required: true,
    validators: [
      Validators.maxLength(40),      // built-in de Angular
      soloLetrasValidator,           // propio
    ],
    hint: 'Solo letras, máximo 40 caracteres',
  },
  {
    key: 'codigo',
    label: 'Código especial',
    type: 'text',
    placeholder: 'ej: abc123',
    validators: [maxNumerosYLetrasValidator],
    hint: 'Máximo 3 números y 10 letras',
  },
];
```

**Las tres formas de validar — cuándo usar cada una:**

| Forma | Cuándo usarla |
|---|---|
| Props declarativas (`required`, `minLength`, `maxLength`...) | Validaciones simples sin código extra |
| `validators: [Validators.maxLength(40), miValidator]` | Reutilizar validators de Angular o propios entre campos/formularios |
| `validate: v => v ? null : 'Error'` | Lógica rápida inline para un campo concreto sin reutilización |

**Convención de mensajes de error en validators propios:**

El validator debe devolver un objeto con clave `message` para que `lib-form` lo muestre directamente:

```typescript
// ✅ lib-form muestra "Solo letras y números"
return { message: 'Solo letras y números' };

// ✅ también funciona un string directo como valor de cualquier clave
return { miError: 'Solo letras y números' };

// ❌ sin message ni string → muestra "Campo no válido"
return { miError: true };
```

---

