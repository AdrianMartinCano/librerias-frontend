# @adrianmartincano/ng-upload

Subida de archivos para Angular: zona drag & drop (lib-upload) con preview de imágenes, validación de tipo/tamaño, barra de progreso y soporte multi-archivo.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-upload
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

## Upload (`@adrianmartincano/ng-upload`)

Zona de drag & drop con preview de imágenes, validación de tipo/tamaño y barra de progreso.

```typescript
import { UploadComponent } from '@adrianmartincano/ng-upload';
import { UploadedFile, UploadError } from '@adrianmartincano/ng-models';
```

### `<lib-upload>`

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `accept` | `string` | `'image/*'` | Tipos permitidos. Mismo formato que el atributo HTML `accept`: `'image/*'`, `'.pdf'`, `'image/png,.pdf'` |
| `multiple` | `boolean` | `false` | Permite seleccionar varios archivos |
| `maxSizeMb` | `number` | `5` | Límite de tamaño por archivo en MB |
| `maxFiles` | `number` | `10` | Número máximo de archivos |
| `label` | `string` | texto por defecto | Texto principal del área de drop |
| `sublabel` | `string` | automático | Subtexto. Si está vacío, muestra `accept` y `maxSizeMb` |
| `showPreview` | `boolean` | `true` | Muestra thumbnails de las imágenes seleccionadas |
| `disabled` | `boolean` | `false` | Desactiva el componente |
| `progress` | `number \| null` | `null` | Progreso de subida 0–100. `null` = no mostrar barra |
| `uploading` | `boolean` | `false` | Muestra spinner sin barra (subida en progreso sin porcentaje) |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `filesSelected` | `File[]` | Emite el array de archivos válidos al seleccionar o eliminar |
| `fileRemoved` | `File` | Emite el archivo eliminado |
| `uploadError` | `UploadError` | Emite cuando un archivo es rechazado (tipo, tamaño o límite superado) |

#### Interfaz UploadError

```typescript
interface UploadError {
  file:    string;                          // nombre del archivo
  reason: 'type' | 'size' | 'max-files';   // motivo del rechazo
  message: string;                          // mensaje legible
}
```

#### Ejemplos

**Imagen de perfil (una sola imagen):**
```html
<lib-upload
  accept="image/*"
  label="Sube tu foto de perfil"
  sublabel="PNG o JPG · Máx. 2MB"
  [maxSizeMb]="2"
  (filesSelected)="onFoto($event)"
  (uploadError)="onError($event)"
/>
```

**Galería múltiple:**
```html
<lib-upload
  accept="image/*"
  [multiple]="true"
  [maxFiles]="8"
  [maxSizeMb]="5"
  label="Sube las fotos de tu galería"
  (filesSelected)="onFotos($event)"
/>
```

**Documentos PDF + imágenes:**
```html
<lib-upload
  accept="image/*,.pdf"
  [multiple]="true"
  [maxSizeMb]="10"
  label="Adjunta tus documentos"
  (filesSelected)="onDocs($event)"
  (uploadError)="onError($event)"
/>
```

**Con barra de progreso (la app controla el valor):**
```typescript
uploadProgress = signal<number | null>(null);

onFiles(files: File[]): void {
  this.uploadProgress.set(0);
  this.miServicio.upload(files).subscribe({
    next: (pct) => this.uploadProgress.set(pct),
    complete: () => this.uploadProgress.set(null),
  });
}
```
```html
<lib-upload
  [progress]="uploadProgress()"
  (filesSelected)="onFiles($event)"
/>
```

**Manejar errores:**
```typescript
onError(err: UploadError): void {
  // err.reason: 'type' | 'size' | 'max-files'
  // err.message: "foto.png supera el límite de 5 MB"
  this.toastService.error(err.message);
}
```

---

