import { Component, ChangeDetectionStrategy, ViewEncapsulation, OnInit, input, output, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'lib-cms-image-upload',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)" />

    @if (previewUrl()) {
      <div class="ciu__preview">
        <img [src]="previewUrl()!" class="ciu__preview-img" alt="Imagen subida" />
        <button type="button" class="ciu__change" (click)="change()">✕ Cambiar</button>
      </div>
    } @else if (uploading()) {
      <span class="ciu__uploading">Subiendo...</span>
    } @else {
      <button type="button" class="cms-btn cms-btn--secondary ciu__trigger" (click)="fileInput.click()">
        ↑ Subir imagen
      </button>
    }

    @if (error()) {
      <p class="ciu__error">{{ error() }}</p>
    }
  `,
  styles: [`
    .ciu__trigger  { font-size: 0.75rem; }
    .ciu__uploading { font-size: 0.78rem; color: var(--color-text-muted, #909090); }
    .ciu__error    { font-size: 0.78rem; color: #e53e3e; margin: 4px 0 0; }

    .ciu__preview {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ciu__preview-img {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--color-border, #e0e0e0);
    }
    .ciu__change {
      font-size: 0.72rem;
      color: var(--color-text-secondary, #595959);
      background: none;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 4px;
      padding: 3px 8px;
      cursor: pointer;
    }
    .ciu__change:hover { color: #e53e3e; border-color: #e53e3e; }
  `],
})
export class CmsImageUploadComponent implements OnInit {
  readonly uploadUrl  = input('/api/files/upload?subdir=cms');
  readonly initialUrl = input<string | null | undefined>(null);
  readonly uploaded   = output<string>();

  readonly uploading  = signal(false);
  readonly error      = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);

  ngOnInit(): void {
    if (this.initialUrl()) this.previewUrl.set(this.initialUrl()!);
  }

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private readonly http = inject(HttpClient);

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set(null);

    const fd = new FormData();
    fd.append('file', file);

    this.http.post<{ data: { url: string } }>(this.uploadUrl(), fd).subscribe({
      next: (res) => {
        this.previewUrl.set(res.data.url);
        this.uploaded.emit(res.data.url);
        this.uploading.set(false);
        input.value = '';
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al subir la imagen. Inténtalo de nuevo.';
        this.error.set(msg);
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  change(): void {
    this.previewUrl.set(null);
    this.error.set(null);
    this.fileInput.nativeElement.click();
  }
}
