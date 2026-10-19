import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  effect,
  output,
  signal,
} from '@angular/core';
import { MarkdownEditorComponent, MarkdownOrHtmlPipe, MarkdownPipe } from '@org/markdown';
import { BlogComment, BlogPost, BlogService } from '../blog.service';

/**
 * Detalle de un post + comentarios. Inputs:
 *  - `slug`: qué post cargar.
 *  - `loggedIn`: si el visitante puede comentar (la app pasa su estado de sesión).
 * Emite `(requireLogin)` cuando alguien no logueado intenta comentar.
 */
@Component({
  selector: 'lib-blog-post',
  imports: [MarkdownEditorComponent, MarkdownPipe, MarkdownOrHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="bp__muted">Cargando…</p>
      }
      @case ('error') {
        <p class="bp__muted">No se pudo cargar la entrada.</p>
      }
      @case ('ready') {
        @if (post(); as p) {
          <article class="bp">
            @if (p.publishedAt) {
              <time class="bp__date eyebrow">{{ p.publishedAt.slice(0, 10) }}</time>
            }
            <h1 class="bp__title">{{ p.title }}</h1>
            @if (p.coverImage) {
              <img class="bp__cover" [src]="p.coverImage" [alt]="p.title" />
            }
            <!-- Markdown, salvo las entradas antiguas escritas en HTML, que se
                 respetan tal cual (ver el pipe libMarkdownOrHtml). -->
            <div class="bp__body lib-md" [innerHTML]="p.body | libMarkdownOrHtml"></div>

            @if (p.tags?.length) {
              <div class="bp__tags">
                @for (t of p.tags; track t) {
                  <span class="bp__tag">{{ t }}</span>
                }
              </div>
            }
          </article>

          <section class="bp__comments">
            <h2 class="bp__ch2">Comentarios</h2>

            @for (c of comments(); track c.id) {
              <div class="bp__comment">
                <p class="bp__comment-head">
                  <strong>{{ c.authorName }}</strong>
                  @if (c.authorIsAdmin) {
                    <span class="bp__admin-badge" title="Administrador">★ Admin</span>
                  }
                  <span class="bp__comment-meta">
                    <span class="bp__comment-date">{{ c.createdAt.slice(0, 10) }}</span>
                    @if (canModerate()) {
                      <button type="button" class="bp__comment-del" (click)="removeComment(c)"
                              title="Borrar comentario">✕</button>
                    }
                  </span>
                </p>
                <div class="bp__comment-body lib-md" [innerHTML]="c.body | libMarkdown"></div>
              </div>
            } @empty {
              <p class="bp__muted">Sé el primero en comentar.</p>
            }

            @if (loggedIn()) {
              <form class="bp__form" (ngSubmit)="send()">
                <lib-markdown-editor
                  [(value)]="draft"
                  [rows]="3"
                  [maxlength]="MAX_COMMENT"
                  placeholder="Escribe un comentario…"
                  ariaLabel="Tu comentario"
                  [disabled]="sending()"
                />
                <div class="bp__form-foot">
                  <button type="submit" [disabled]="sending() || !draft().trim()">
                    {{ sending() ? 'Enviando…' : 'Comentar' }}
                  </button>
                </div>
              </form>
            } @else {
              <p class="bp__login">
                <a href="javascript:void(0)" (click)="requireLogin.emit()">Inicia sesión</a>
                para dejar un comentario.
              </p>
            }
          </section>
        }
      }
    }
  `,
  styles: [
    `
      .bp__muted {
        color: var(--color-text-secondary, #5c5346);
      }
      .bp {
        max-width: 720px;
        margin: 0 auto;
      }
      .bp__date {
        font-variant: small-caps;
        letter-spacing: 0.12em;
        color: var(--color-accent, #a87f3e);
      }
      .bp__title {
        color: var(--color-primary, #0e3a45);
        font-size: clamp(2rem, 5vw, 3rem);
        margin: 0.3rem 0 1rem;
      }
      .bp__cover {
        width: 100%;
        border-radius: 3px;
        border: 1px solid var(--color-accent, #a87f3e);
        margin-bottom: 1.4rem;
      }
      .bp__body {
        font-size: 1.12rem;
        line-height: 1.8;
      }
      .bp__tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 1.5rem;
      }
      .bp__tag {
        font-variant: small-caps;
        letter-spacing: 0.08em;
        font-size: 0.8rem;
        color: var(--color-accent, #a87f3e);
        border: 1px solid var(--color-accent, #a87f3e);
        border-radius: 2px;
        padding: 0.1rem 0.5rem;
      }
      .bp__comments {
        max-width: 720px;
        margin: 3rem auto 0;
        border-top: 1px solid var(--color-border, #cdbf9f);
        padding-top: 1.5rem;
      }
      .bp__ch2 {
        color: var(--color-primary, #0e3a45);
      }
      .bp__comment {
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 4px;
        padding: 0.8rem 1rem;
        margin-bottom: 0.7rem;
        background: var(--color-surface, #fbf5e6);
      }
      .bp__comment-head {
        margin: 0 0 0.3rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-primary, #0e3a45);
      }
      .bp__comment-meta { margin-left: auto; }
      .bp__admin-badge {
        font-size: 0.7rem;
        font-weight: 700;
        font-variant: small-caps;
        letter-spacing: 0.06em;
        color: var(--color-text-on-primary, #f4ecd8);
        background: var(--color-accent, #a87f3e);
        border-radius: 2px;
        padding: 0.08rem 0.4rem;
      }
      .bp__comment-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
      }
      .bp__comment-date {
        color: var(--color-text-muted, #8a7f6d);
        font-size: 0.85rem;
      }
      .bp__comment-del {
        background: transparent;
        border: 0;
        color: var(--color-danger, #b14b43);
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0;
      }
      /* El formato del contenido lo pone .lib-md (global, en el theme): el HTML
         que entra por [innerHTML] no recibe la encapsulación del componente. */
      .bp__comment-body {
        margin: 0;
        line-height: 1.6;
      }
      .bp__form {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .bp__form-foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
      }
      .bp__form button {
        background: var(--color-primary, #0e3a45);
        color: var(--color-text-on-primary, #f4ecd8);
        border: 0;
        padding: 0.6rem 1.3rem;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
      }
      .bp__form button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .bp__login a {
        color: var(--color-accent, #15616d);
        font-weight: 600;
      }
    `,
  ],
})
export class BlogPostComponent {
  private readonly blog = inject(BlogService);

  readonly slug = input.required<string>();
  readonly loggedIn = input(false);
  /** Si el visitante puede moderar (borrar) comentarios — la app pasa si es admin. */
  readonly canModerate = input(false);
  readonly requireLogin = output<void>();

  readonly post = signal<BlogPost | null>(null);
  readonly comments = signal<BlogComment[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly sending = signal(false);
  /** Límite del comentario (alineado con el backend: @Size max 2000). */
  readonly MAX_COMMENT = 2000;
  /** Markdown en crudo del editor: se manda al backend tal cual. */
  readonly draft = signal('');

  constructor() {
    effect(() => {
      const s = this.slug();
      if (!s) return;
      this.state.set('loading');
      this.blog.getBySlug(s).subscribe({
        next: (p) => {
          this.post.set(p);
          this.state.set('ready');
          this.loadComments(s);
        },
        error: () => this.state.set('error'),
      });
    });
  }

  private loadComments(slug: string): void {
    this.blog.comments(slug).subscribe({
      next: (c) => this.comments.set(c),
      error: () => {},
    });
  }

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.sending.set(true);
    this.blog.addComment(this.slug(), text).subscribe({
      next: (c) => {
        this.comments.update((list) => [...list, c]);
        this.draft.set('');
        this.sending.set(false);
      },
      error: () => this.sending.set(false),
    });
  }

  removeComment(c: BlogComment): void {
    if (!confirm(`¿Borrar el comentario de ${c.authorName}?`)) return;
    this.blog.deleteComment(c.id).subscribe({
      next: () => this.comments.update((list) => list.filter((x) => x.id !== c.id)),
      error: () => {},
    });
  }
}
