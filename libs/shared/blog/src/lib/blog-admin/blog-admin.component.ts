import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MarkdownEditorComponent, looksLikeHtml } from '@org/markdown';
import { BlogPostSummary, BlogService, SaveBlogPost } from '../blog.service';

/**
 * Panel de administración del blog: lista de entradas + editor para crear/editar,
 * publicar/despublicar y borrar. Pensado para incrustar en un panel de admin.
 */
@Component({
  selector: 'lib-blog-admin',
  imports: [FormsModule, MarkdownEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editing()) {
      <form class="ba-form" #f="ngForm" (ngSubmit)="save(f)" novalidate>
        <h3>{{ editId() ? 'Editar entrada' : 'Nueva entrada' }}</h3>
        <label>
          <span class="ba-lbl">Título <em class="ba-count">{{ form.title.length }}/{{ MAX_TITLE }}</em></span>
          <input name="title" #title="ngModel" [(ngModel)]="form.title" [maxlength]="MAX_TITLE" required />
          @if (title.invalid && title.touched) {
            <span class="ba-err">El título es obligatorio.</span>
          }
        </label>
        <label>
          <span class="ba-lbl">Resumen (para el listado) <em class="ba-count">{{ (form.excerpt || '').length }}/{{ MAX_EXCERPT }}</em></span>
          <textarea name="excerpt" rows="2" [(ngModel)]="form.excerpt" [maxlength]="MAX_EXCERPT"></textarea>
        </label>
        <label>
          <span class="ba-lbl">Contenido</span>
          @if (legacyHtml()) {
            <span class="ba-note">
              Esta entrada se escribió en HTML y se sigue publicando tal cual. Si la
              reescribes con los botones de formato, pasará a markdown.
            </span>
          }
          <lib-markdown-editor
            [(value)]="body" [rows]="10" [maxlength]="MAX_BODY"
            ariaLabel="Contenido de la entrada" [allowLegacyHtml]="true" />
        </label>
        <label>
          <span class="ba-lbl">Imagen de portada</span>
          <div class="ba-cover">
            @if (form.coverImage) {
              <img class="ba-cover__img" [src]="form.coverImage" alt="Portada" />
            }
            <div class="ba-cover__upload">
              <label class="ba-upload">
                <span class="ba-upload__icon">⬆</span>
                <span>{{ uploading() ? 'Subiendo…' : (form.coverImage ? 'Cambiar imagen' : 'Subir imagen') }}</span>
                <input type="file" accept="image/*" (change)="onFile($event)" [disabled]="uploading()" hidden />
              </label>
            </div>
          </div>
        </label>
        <label>Etiquetas (separadas por comas)
          <input name="tags" [(ngModel)]="tagsText" placeholder="amistad, viaje" />
        </label>
        <label class="ba-check">
          <input type="checkbox" name="pub" [(ngModel)]="form.published" />
          Publicada (visible para el público)
        </label>
        <div class="ba-actions">
          <button type="submit" class="ba-btn" [disabled]="saving() || f.invalid || !body().trim()">
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
          <button type="button" class="ba-btn ba-btn--ghost" (click)="cancel()">Cancelar</button>
        </div>
      </form>
    } @else {
      <div class="ba-head">
        <button type="button" class="ba-btn" (click)="newPost()">+ Nueva entrada</button>
      </div>
      @switch (state()) {
        @case ('loading') { <p class="ba-muted">Cargando…</p> }
        @case ('error') { <p class="ba-muted">No se pudieron cargar las entradas.</p> }
        @case ('ready') {
          @for (p of posts(); track p.id) {
            <div class="ba-row">
              <div class="ba-row__info">
                <span class="ba-row__title">{{ p.title }}</span>
                <span class="ba-badge" [class.ba-badge--draft]="!p.published">
                  {{ p.published ? 'Publicada' : 'Borrador' }}
                </span>
              </div>
              <div class="ba-row__actions">
                <button type="button" class="ba-act" (click)="edit(p)">Editar</button>
                <button type="button" class="ba-act ba-act--danger" (click)="remove(p)">Borrar</button>
              </div>
            </div>
          } @empty {
            <p class="ba-muted">No hay entradas todavía.</p>
          }
        }
      }
    }
  `,
  styles: [
    `
      .ba-muted { color: var(--color-text-secondary, #5c5346); }
      .ba-head { margin-bottom: 1rem; }
      .ba-btn {
        background: var(--color-primary, #0e3a45);
        color: var(--color-text-on-primary, #f4ecd8);
        border: 0;
        padding: 0.55rem 1.1rem;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
      }
      .ba-btn--ghost {
        background: transparent;
        color: var(--color-primary, #0e3a45);
        border: 1px solid var(--color-border, #cdbf9f);
      }
      .ba-btn:disabled { opacity: 0.6; }
      .ba-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 4px;
        padding: 0.7rem 1rem;
        margin-bottom: 0.6rem;
        background: var(--color-surface, #fbf5e6);
      }
      .ba-row__title { font-weight: 600; color: var(--color-primary, #0e3a45); margin-right: 0.6rem; }
      .ba-badge {
        font-size: 0.72rem;
        font-weight: 700;
        font-variant: small-caps;
        letter-spacing: 0.06em;
        padding: 0.12rem 0.5rem;
        border-radius: 2px;
        background: #d3f0dd;
        color: #1f7a45;
      }
      .ba-badge--draft { background: #fde8c7; color: #8a5a00; }
      .ba-row__actions { display: flex; gap: 0.6rem; flex-shrink: 0; }
      .ba-act {
        background: transparent;
        border: 1px solid var(--color-border, #cdbf9f);
        color: var(--color-primary, #0e3a45);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 0.35rem 0.8rem;
        border-radius: 3px;
        cursor: pointer;
      }
      .ba-act:hover { background: rgba(168, 127, 62, 0.08); }
      .ba-act--danger { color: var(--color-danger, #b14b43); border-color: #d8a7a2; }
      .ba-act--danger:hover { background: #fbeceb; }
      .ba-cover { display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
      .ba-cover__img {
        width: 90px; height: 90px; object-fit: cover;
        border-radius: 3px; border: 1px solid var(--color-border, #cdbf9f);
      }
      .ba-cover__upload { font-weight: 400; }
      .ba-upload {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--color-surface, #fbf5e6);
        color: var(--color-primary, #0e3a45);
        border: 1px solid var(--color-accent, #a87f3e);
        padding: 0.5rem 1.1rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .ba-upload:hover { background: rgba(168, 127, 62, 0.1); }
      .ba-upload__icon {
        font-size: 1.1rem;
        line-height: 1;
      }
      .ba-lbl { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
      .ba-count {
        font-style: normal;
        font-weight: 400;
        font-size: 0.78rem;
        color: var(--color-text-muted, #8a7f6d);
      }
      .ba-form { display: flex; flex-direction: column; gap: 0.8rem; }
      .ba-form h3 { color: var(--color-primary, #0e3a45); margin: 0; }
      .ba-form label { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; color: var(--color-primary, #0e3a45); font-size: 0.9rem; }
      .ba-form input, .ba-form textarea {
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 4px;
        font: inherit;
      }
      .ba-check { flex-direction: row !important; align-items: center; gap: 0.5rem; }
      .ba-actions { display: flex; gap: 0.7rem; }
      .ba-err { color: var(--color-danger, #b14b43); font-weight: 600; font-size: 0.82rem; }
      .ba-note {
        display: block;
        margin-bottom: 0.4rem;
        padding: 0.4rem 0.6rem;
        border-left: 3px solid var(--color-accent, #a87f3e);
        background: rgb(0 0 0 / 0.03);
        color: var(--color-text-secondary, #5c5346);
        font-size: 0.82rem;
      }
      .ba-form input.ng-invalid.ng-touched,
      .ba-form textarea.ng-invalid.ng-touched {
        border-color: var(--color-danger, #b14b43);
      }
    `,
  ],
})
export class BlogAdminComponent {
  private readonly blog = inject(BlogService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly posts = signal<BlogPostSummary[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly editing = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly uploading = signal(false);

  /** Límites de longitud (alineados con el backend spring-blog). */
  readonly MAX_TITLE = 200;
  readonly MAX_EXCERPT = 600;
  readonly MAX_BODY = 20000;

  form: SaveBlogPost = this.empty();
  tagsText = '';
  /**
   * Cuerpo de la entrada, en su propio signal porque lo maneja
   * `lib-markdown-editor` (no `ngModel`). Se vuelca sobre `form` al guardar.
   */
  readonly body = signal('');
  /** La entrada abierta venía escrita en HTML: se avisa para que no sorprenda. */
  readonly legacyHtml = signal(false);

  constructor() {
    this.load();
  }

  private empty(): SaveBlogPost {
    return { title: '', excerpt: '', body: '', coverImage: '', tags: [], published: false };
  }

  private load(): void {
    this.state.set('loading');
    this.blog.adminList().subscribe({
      next: (p) => {
        this.posts.set(p);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  newPost(): void {
    this.form = this.empty();
    this.tagsText = '';
    this.body.set('');
    this.legacyHtml.set(false);
    this.editId.set(null);
    this.editing.set(true);
  }

  edit(p: BlogPostSummary): void {
    this.editId.set(p.id);
    this.editing.set(true);
    this.body.set('');
    this.legacyHtml.set(false);
    this.blog.adminGet(p.id).subscribe({
      next: (full) => {
        this.body.set(full.body);
        this.legacyHtml.set(looksLikeHtml(full.body));
        this.form = {
          title: full.title,
          excerpt: full.excerpt ?? '',
          body: full.body,
          coverImage: full.coverImage ?? '',
          tags: full.tags ?? [],
          published: full.published,
        };
        this.tagsText = (full.tags ?? []).join(', ');
        // OnPush: la respuesta async reasigna `form` sin tocar un signal → forzar refresco.
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  /** Sube la imagen elegida y la pone como portada. */
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.blog.uploadImage(file).subscribe({
      next: (url) => {
        this.form.coverImage = url;
        this.uploading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.uploading.set(false),
    });
  }

  cancel(): void {
    this.editing.set(false);
  }

  save(f?: NgForm): void {
    // Si el formulario no es válido, marca los campos y muestra los errores.
    if (f && f.invalid) {
      f.control.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.form.body = this.body();
    this.form.tags = this.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const id = this.editId();
    const op = id ? this.blog.adminUpdate(id, this.form) : this.blog.adminCreate(this.form);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(p: BlogPostSummary): void {
    if (!confirm(`¿Borrar «${p.title}»?`)) return;
    this.blog.adminDelete(p.id).subscribe({
      next: () => this.posts.update((list) => list.filter((x) => x.id !== p.id)),
      error: () => {},
    });
  }
}
