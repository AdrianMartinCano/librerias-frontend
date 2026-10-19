import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { UploadedFile, UploadError } from '@org/models';

@Component({
  selector: 'lib-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent {
  /** Tipos aceptados. Formato del atributo HTML accept: 'image/*', '.pdf', 'image/png,image/jpeg' */
  readonly accept      = input('image/*');
  readonly multiple    = input(false);
  readonly maxSizeMb   = input(5);
  readonly maxFiles    = input(10);
  readonly label       = input('Arrastra archivos aquí o haz clic para seleccionar');
  readonly sublabel    = input('');
  readonly showPreview = input(true);
  readonly disabled    = input(false);
  /** Progreso de subida 0-100. null = no mostrar barra */
  readonly progress    = input<number | null>(null);
  readonly uploading   = input(false);

  readonly filesSelected = output<File[]>();
  readonly fileRemoved   = output<File>();
  readonly uploadError   = output<UploadError>();

  readonly files      = signal<UploadedFile[]>([]);
  readonly errors     = signal<UploadError[]>([]);
  readonly isDragging = signal(false);

  readonly canAddMore = computed(
    () => this.multiple() && this.files().length < this.maxFiles()
  );

  constructor() {
    // Libera las object URLs de las previews al destruir el componente (evita fugas de memoria).
    inject(DestroyRef).onDestroy(() => this.files().forEach((f) => this.revoke(f)));
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.disabled()) this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    if (this.disabled() || !e.dataTransfer?.files) return;
    this.addFiles(e.dataTransfer.files);
  }

  onFileInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    input.value = '';
  }

  removeFile(uploaded: UploadedFile): void {
    this.revoke(uploaded);
    this.files.update((list) => list.filter((f) => f !== uploaded));
    this.fileRemoved.emit(uploaded.file);
    this.filesSelected.emit(this.files().map((f) => f.file));
    this.errors.set([]);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private addFiles(fileList: FileList): void {
    const incoming = Array.from(fileList);
    const newErrors: UploadError[] = [];
    const valid: UploadedFile[] = [];

    for (const file of incoming) {
      if (!this.isValidType(file)) {
        this.pushError(newErrors, file.name, 'type', `"${file.name}" no es un formato permitido`);
        continue;
      }

      if (file.size > this.maxSizeMb() * 1024 * 1024) {
        this.pushError(newErrors, file.name, 'size', `"${file.name}" supera el límite de ${this.maxSizeMb()} MB`);
        continue;
      }

      const currentCount = this.files().length + valid.length;
      if (currentCount >= this.maxFiles()) {
        this.pushError(newErrors, file.name, 'max-files',
          `Solo se permiten ${this.maxFiles()} archivo${this.maxFiles() === 1 ? '' : 's'}`);
        break;
      }

      valid.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        // Preview eficiente y síncrona: object URL en vez de base64 (se libera al quitar/destruir).
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    this.errors.set(newErrors);

    if (valid.length === 0) return;

    if (!this.multiple()) {
      this.files().forEach((f) => this.revoke(f));      // libera las que se reemplazan
      valid.slice(1).forEach((f) => this.revoke(f));    // y las descartadas (solo se queda la 1ª)
      this.files.set(valid.slice(0, 1));
    } else {
      this.files.update((list) => [...list, ...valid]);
    }

    this.filesSelected.emit(this.files().map((f) => f.file));
  }

  private pushError(bucket: UploadError[], file: string, reason: UploadError['reason'], message: string): void {
    const err: UploadError = { file, reason, message };
    bucket.push(err);
    this.uploadError.emit(err);
  }

  private revoke(entry: UploadedFile): void {
    if (entry.preview?.startsWith('blob:')) URL.revokeObjectURL(entry.preview);
  }

  private isValidType(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept || accept === '*' || accept === '*/*') return true;

    return accept.split(',').some((pattern) => {
      const p = pattern.trim();
      if (p.startsWith('.')) {
        return file.name.toLowerCase().endsWith(p.toLowerCase());
      }
      if (p.endsWith('/*')) {
        const mainType = p.split('/')[0];
        return file.type.startsWith(`${mainType}/`);
      }
      return file.type === p;
    });
  }
}
