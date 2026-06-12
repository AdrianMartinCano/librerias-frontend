import {
  Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, signal, computed,
  OnInit, effect, untracked, ViewChild, ElementRef, DestroyRef, inject,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CmsBlock, CmsBlockType, CmsPage } from '@org/models';
import { CmsPageDetail } from '../models/cms-admin.models';
import { BlockEditorComponent } from '../block-editor/block-editor.component';

const BLOCK_TYPES: { type: CmsBlockType; label: string }[] = [
  { type: 'hero',         label: 'Hero' },
  { type: 'text',         label: 'Texto' },
  { type: 'text-image',   label: 'Texto + Imagen' },
  { type: 'features',     label: 'Features' },
  { type: 'gallery',      label: 'Galería' },
  { type: 'cta-banner',   label: 'CTA Banner' },
  { type: 'faq',          label: 'FAQ' },
  { type: 'testimonials', label: 'Testimonios' },
  { type: 'pricing',      label: 'Precios' },
  { type: 'counters',     label: 'Contadores' },
  { type: 'trust-badges', label: 'Trust Badges' },
  { type: 'newsletter',   label: 'Newsletter' },
];

@Component({
  selector: 'lib-cms-page-builder',
  standalone: true,
  imports: [ReactiveFormsModule, BlockEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cpb" [class.cpb--split]="showPreview()">
      <div class="cpb__main">
        <form [formGroup]="metaForm" class="cpb__meta">
          <label class="cms-field">
            <span>Slug <span class="cms-field__req">*</span> <small>(ej. home, sobre-nosotros)</small></span>
            <input formControlName="slug" type="text"
              [class.cms-field__input--error]="metaForm.get('slug')?.invalid && metaForm.get('slug')?.touched" />
            @if (metaForm.get('slug')?.invalid && metaForm.get('slug')?.touched) {
              <span class="cms-field__error">Este campo es obligatorio</span>
            }
          </label>
          <label class="cms-field">
            <span>Título <span class="cms-field__req">*</span></span>
            <input formControlName="title" type="text"
              [class.cms-field__input--error]="metaForm.get('title')?.invalid && metaForm.get('title')?.touched" />
            @if (metaForm.get('title')?.invalid && metaForm.get('title')?.touched) {
              <span class="cms-field__error">Este campo es obligatorio</span>
            }
          </label>
          <label class="cms-field">
            <span>Meta descripción</span>
            <input formControlName="description" type="text" />
          </label>
        </form>

        <div class="cpb__blocks">
          <h3 class="cpb__section-title">Bloques ({{ blocks().length }})</h3>
          @for (block of blocks(); track block.id ?? $index; let i = $index) {
            <lib-cms-block-editor
              [block]="block"
              [isFirst]="i === 0"
              [isLast]="i === blocks().length - 1"
              (changed)="updateBlockData(i, $event)"
              (move)="moveBlock(i, $event)"
              (remove)="removeBlock(i)"
            />
          }
          @if (blocks().length === 0) {
            <p class="cpb__empty">No hay bloques. Añade el primero.</p>
          }
        </div>

        <div class="cpb__add-block">
          <span class="cpb__add-label">Añadir bloque:</span>
          @for (bt of blockTypes; track bt.type) {
            <button type="button" class="cms-btn cms-btn--secondary" (click)="addBlock(bt.type)">
              + {{ bt.label }}
            </button>
          }
        </div>
      </div>

      @if (showPreview()) {
        <div class="cpb__preview-pane">
          <iframe #previewFrame [src]="iframeSrc()" class="cpb__preview-iframe" title="Vista previa"></iframe>
        </div>
      }

      <div class="cpb__footer">
        <label class="cms-field cms-field--row">
          <input type="checkbox" [checked]="published()" (change)="published.set(!published())" />
          <span>Publicada</span>
        </label>
        <div class="cpb__footer-actions">
          <button type="button" class="cms-btn cms-btn--secondary" (click)="togglePreview()">
            {{ showPreview() ? 'Ocultar preview' : 'Vista previa' }}
          </button>
          <button type="button" class="cms-btn cms-btn--secondary" (click)="cancel.emit()">Cancelar</button>
          <button
            type="button"
            class="cms-btn cms-btn--primary"
            [disabled]="metaForm.invalid"
            (click)="save()"
          >Guardar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Shared form styles (global via ViewEncapsulation.None) ─────────── */
    .cms-block-form { display: flex; flex-direction: column; gap: 12px; }

    .cms-field { display: flex; flex-direction: column; gap: 5px; font-size: 0.875rem; }
    .cms-field > span { font-weight: 600; font-size: 0.78rem; color: var(--color-text-muted, #909090); text-transform: uppercase; letter-spacing: 0.04em; }

    .cms-field input:not([type="checkbox"]),
    .cms-field select,
    .cms-field textarea {
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 0.875rem;
      font-family: inherit;
      background: var(--color-background, #fff);
      color: var(--color-text, #1a1a1a);
      width: 100%;
      box-sizing: border-box;
      transition: border-color 120ms, box-shadow 120ms;
    }

    .cms-field input:not([type="checkbox"]):focus,
    .cms-field select:focus,
    .cms-field textarea:focus {
      outline: none;
      border-color: var(--color-accent, #ff4d4d);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent, #ff4d4d) 15%, transparent);
    }

    .cms-field textarea { min-height: 90px; resize: vertical; }

    .cms-field--row { flex-direction: row; align-items: center; gap: 8px; }
    .cms-field--row > span { text-transform: none; font-size: 0.875rem; letter-spacing: 0; }
    .cms-field--row input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-accent, #ff4d4d); flex-shrink: 0; cursor: pointer; }

    .cms-fieldset {
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--color-surface, #f8f9fa);
    }

    .cms-fieldset legend { font-size: 0.7rem; font-weight: 700; padding: 0 6px; color: var(--color-text-muted, #909090); text-transform: uppercase; letter-spacing: 0.06em; }

    .cms-field__req { color: var(--color-danger, #dc3545); }
    .cms-field__error { font-size: 0.75rem; color: var(--color-danger, #dc3545); font-weight: 500; }

    .cms-field input.cms-field__input--error,
    .cms-field select.cms-field__input--error,
    .cms-field textarea.cms-field__input--error {
      border-color: var(--color-danger, #dc3545);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger, #dc3545) 12%, transparent);
    }

    .cms-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: opacity 120ms, transform 120ms;
      font-family: inherit;
      white-space: nowrap;
      line-height: 1.4;
    }
    .cms-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cms-btn--primary { background: var(--color-accent, #ff4d4d); color: #fff; border-color: var(--color-accent, #ff4d4d); }
    .cms-btn--secondary { background: var(--color-background, #fff); border-color: var(--color-border, #e0e0e0); color: var(--color-text, #1a1a1a); }
    .cms-btn--danger { background: transparent; border-color: #e53e3e; color: #e53e3e; }
    .cms-btn:not(:disabled):hover { opacity: 0.82; transform: translateY(-1px); }

    /* ── Page builder layout ─────────────────────────────────────────────── */
    .cpb { display: flex; flex-direction: column; gap: 16px; font-family: var(--font-family, system-ui, sans-serif); }
    .cpb__main { display: flex; flex-direction: column; gap: 16px; }

    .cpb__meta {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cpb__blocks { display: flex; flex-direction: column; }

    .cpb__section-title { margin: 0 0 10px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted, #909090); }

    .cpb__empty { text-align: center; color: var(--color-text-muted, #909090); padding: 32px; border: 2px dashed var(--color-border, #e0e0e0); border-radius: 8px; font-size: 0.875rem; }

    .cpb__add-block { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 12px 14px; background: var(--color-surface, #f8f9fa); border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; }
    .cpb__add-label { font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted, #909090); margin-right: 4px; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; }

    .cpb__footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 0; border-top: 1px solid var(--color-border, #e0e0e0); flex-wrap: wrap; gap: 8px; }
    .cpb__footer-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .cpb--split { display: grid; grid-template-columns: 400px 1fr; grid-template-rows: 1fr auto; column-gap: 24px; align-items: start; }
    .cpb--split .cpb__main { grid-column: 1; grid-row: 1; }
    .cpb--split .cpb__preview-pane { grid-column: 2; grid-row: 1 / 3; position: sticky; top: 16px; }
    .cpb--split .cpb__footer { grid-column: 1; grid-row: 2; }

    .cpb__preview-iframe { width: 100%; height: calc(100vh - 100px); border: 1px solid var(--color-border, #e0e0e0); border-radius: 10px; display: block; background: var(--color-background, #fff); }
  `],
})
export class CmsPageBuilderComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly sanitizer  = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly page        = input.required<CmsPageDetail | null>();
  readonly previewPath = input('/cms-preview');

  readonly saved  = output<{ slug: string; title: string; description: string; blocks: CmsBlock[]; published: boolean }>();
  readonly cancel = output<void>();

  readonly blocks      = signal<CmsBlock[]>([]);
  readonly published   = signal(false);
  readonly showPreview = signal(false);
  readonly iframeSrc   = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.previewPath())
  );

  readonly blockTypes = BLOCK_TYPES;

  metaForm!: FormGroup;

  @ViewChild('previewFrame') private previewFrame?: ElementRef<HTMLIFrameElement>;

  private readonly _syncPreview = effect(() => {
    this.blocks();
    untracked(() => this.sendPreviewUpdate());
  });

  ngOnInit(): void {
    const p = this.page();
    this.metaForm = this.fb.group({
      slug:        [p?.slug        ?? '', Validators.required],
      title:       [p?.title       ?? '', Validators.required],
      description: [p?.description ?? ''],
    });
    this.blocks.set(p?.blocks ? JSON.parse(JSON.stringify(p.blocks)) : []);
    this.published.set(p?.published ?? false);

    this.metaForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.sendPreviewUpdate());

    const readyHandler = (e: MessageEvent) => {
      if (e.data?.type === 'CMS_PREVIEW_READY') this.sendPreviewUpdate();
    };
    window.addEventListener('message', readyHandler);
    this.destroyRef.onDestroy(() => window.removeEventListener('message', readyHandler));
  }

  togglePreview(): void { this.showPreview.update(v => !v); }

  addBlock(type: CmsBlockType): void {
    const block: CmsBlock = { type, data: this.defaultData(type), id: crypto.randomUUID() };
    this.blocks.update(bs => [...bs, block]);
  }

  removeBlock(i: number): void {
    this.blocks.update(bs => bs.filter((_, idx) => idx !== i));
  }

  moveBlock(i: number, dir: 'up' | 'down'): void {
    this.blocks.update(bs => {
      const arr = [...bs];
      const swap = dir === 'up' ? i - 1 : i + 1;
      [arr[i], arr[swap]] = [arr[swap], arr[i]];
      return arr;
    });
  }

  updateBlockData(i: number, data: unknown): void {
    this.blocks.update(bs => bs.map((b, idx) => idx === i ? { ...b, data: data as Record<string, unknown> } : b));
  }

  save(): void {
    if (this.metaForm.invalid) return;
    const v = this.metaForm.value;
    this.saved.emit({ slug: v.slug, title: v.title, description: v.description, blocks: this.blocks(), published: this.published() });
  }

  private sendPreviewUpdate(): void {
    if (!this.showPreview()) return;
    const iframe = this.previewFrame?.nativeElement;
    if (!iframe?.contentWindow) return;
    const v = this.metaForm?.value ?? {};
    const page: CmsPage = {
      slug:        v.slug        ?? '',
      title:       v.title       ?? '',
      description: v.description ?? '',
      blocks:      this.blocks(),
    };
    iframe.contentWindow.postMessage({ type: 'CMS_PREVIEW_UPDATE', page }, '*');
  }

  private defaultData(type: CmsBlockType): Record<string, unknown> {
    const defaults: Partial<Record<CmsBlockType, Record<string, unknown>>> = {
      'hero':         { title: 'Nuevo hero', align: 'left' },
      'text':         { content: 'Escribe aquí...', align: 'left' },
      'text-image':   { text: '', image: '' },
      'features':     { items: [] },
      'gallery':      { images: [] },
      'cta-banner':   { title: '', cta: { label: '', href: '' } },
      'faq':          { items: [] },
      'testimonials': { items: [] },
      'pricing':      { plans: [] },
      'counters':     { items: [], cols: 4 },
      'trust-badges': { items: [], align: 'left' },
      'newsletter':   { layout: 'inline', background: 'surface', align: 'center' },
    };
    return defaults[type] ?? {};
  }
}
