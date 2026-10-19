import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarkdownEditorComponent } from '@org/markdown';
import { ForumService, ForumThreadSummary } from '../forum.service';

/**
 * Lista de hilos de una categoría (fijados primero). Permite abrir un hilo nuevo.
 * Inputs:
 *  - `categorySlug`: qué categoría mostrar.
 *  - `loggedIn`: si el visitante puede abrir hilos.
 * Emite `(threadClick)` con el slug del hilo y `(requireLogin)` si un anónimo intenta postear.
 */
@Component({
  selector: 'lib-forum-threads',
  imports: [FormsModule, MarkdownEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="ft__muted">Cargando hilos…</p>
      }
      @case ('error') {
        <p class="ft__muted">No se pudieron cargar los hilos.</p>
      }
      @case ('ready') {
        @if (loggedIn()) {
          <div class="ft__new">
            @if (!composing()) {
              <button type="button" class="ft__newbtn" (click)="composing.set(true)">+ Abrir un tema</button>
            } @else {
              <form class="ft__form" (ngSubmit)="create()">
                <input
                  [(ngModel)]="title" name="title" [maxlength]="200"
                  placeholder="Título del tema" [disabled]="sending()" />
                <lib-markdown-editor
                  [(value)]="body" [rows]="4" [maxlength]="20000"
                  placeholder="Escribe el primer mensaje…" ariaLabel="Primer mensaje"
                  [disabled]="sending()" />
                <div class="ft__form-foot">
                  <button type="button" class="ft__cancel" (click)="cancel()" [disabled]="sending()">Cancelar</button>
                  <button type="submit" [disabled]="sending() || !title.trim() || !body().trim()">
                    {{ sending() ? 'Publicando…' : 'Publicar tema' }}
                  </button>
                </div>
              </form>
            }
          </div>
        } @else {
          <p class="ft__login">
            <a href="javascript:void(0)" (click)="requireLogin.emit()">Inicia sesión</a>
            para abrir un tema.
          </p>
        }

        <div class="ft">
          @for (t of threads(); track t.id) {
            <article class="ft-row" (click)="threadClick.emit(t.slug)"
                     tabindex="0" (keyup.enter)="threadClick.emit(t.slug)">
              <div class="ft-row__main">
                <h3 class="ft-row__title">
                  @if (t.pinned) { <span class="ft-tag ft-tag--pin" title="Fijado">📌</span> }
                  @if (t.locked) { <span class="ft-tag ft-tag--lock" title="Cerrado">🔒</span> }
                  {{ t.title }}
                </h3>
                <p class="ft-row__meta">
                  por <strong>{{ t.authorName }}</strong>
                  @if (t.authorIsAdmin) { <span class="ft-badge">★ Admin</span> }
                </p>
              </div>
              <div class="ft-row__stats">
                <span><strong>{{ t.replyCount }}</strong> resp.</span>
                <span><strong>{{ t.viewCount }}</strong> vistas</span>
              </div>
            </article>
          } @empty {
            <p class="ft__muted">Aún no hay temas. ¡Abre el primero!</p>
          }
        </div>

        @if (hasNext()) {
          <button type="button" class="ft__more" (click)="loadMore()" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Cargando…' : 'Cargar más' }}
          </button>
        }
      }
    }
  `,
  styles: [
    `
      .ft { display: flex; flex-direction: column; gap: 0.6rem; }
      .ft__muted { color: var(--color-text-secondary, #5c5346); }
      .ft-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 4px;
        background: var(--color-surface, #fbf5e6);
        padding: 0.8rem 1.1rem;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .ft-row:hover { background: rgba(168, 127, 62, 0.06); }
      .ft-row__title {
        margin: 0;
        color: var(--color-primary, #0e3a45);
        font-size: 1.15rem;
      }
      .ft-row__meta {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: var(--color-text-muted, #8a7f6d);
      }
      .ft-badge {
        font-size: 0.68rem;
        font-weight: 700;
        font-variant: small-caps;
        color: var(--color-text-on-primary, #f4ecd8);
        background: var(--color-accent, #a87f3e);
        border-radius: 2px;
        padding: 0.05rem 0.35rem;
        margin-left: 0.3rem;
      }
      .ft-row__stats {
        display: flex;
        gap: 1rem;
        font-size: 0.78rem;
        color: var(--color-text-muted, #8a7f6d);
        white-space: nowrap;
      }
      .ft-row__stats strong { color: var(--color-accent, #a87f3e); }
      .ft__new { margin-bottom: 1.2rem; }
      .ft__newbtn, .ft__more {
        background: transparent;
        border: 1px solid var(--color-accent, #a87f3e);
        color: var(--color-primary, #0e3a45);
        font-weight: 600;
        padding: 0.55rem 1.2rem;
        border-radius: 3px;
        cursor: pointer;
      }
      .ft__more { display: block; margin: 1.4rem auto 0; }
      .ft__form { display: flex; flex-direction: column; gap: 0.6rem; }
      .ft__form input {
        padding: 0.6rem 0.7rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 4px;
        font: inherit;
      }
      .ft__form-foot { display: flex; justify-content: flex-end; gap: 0.6rem; }
      .ft__form button[type='submit'] {
        background: var(--color-primary, #0e3a45);
        color: var(--color-text-on-primary, #f4ecd8);
        border: 0;
        padding: 0.55rem 1.2rem;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
      }
      .ft__cancel {
        background: transparent;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 3px;
        padding: 0.55rem 1rem;
        cursor: pointer;
      }
      .ft__form button:disabled { opacity: 0.6; cursor: default; }
      .ft__login a { color: var(--color-accent, #15616d); font-weight: 600; }
    `,
  ],
})
export class ForumThreadsComponent {
  private readonly forum = inject(ForumService);

  readonly categorySlug = input.required<string>();
  readonly loggedIn = input(false);

  readonly threadClick = output<string>();
  readonly requireLogin = output<void>();

  readonly threads = signal<ForumThreadSummary[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly hasNext = signal(false);
  readonly loadingMore = signal(false);
  readonly composing = signal(false);
  readonly sending = signal(false);

  title = '';
  /** Markdown en crudo del editor. */
  readonly body = signal('');
  private page = 0;
  private static readonly PAGE_SIZE = 20;

  constructor() {
    effect(() => {
      const slug = this.categorySlug();
      if (!slug) return;
      this.page = 0;
      this.state.set('loading');
      this.forum.threads(slug, 0, ForumThreadsComponent.PAGE_SIZE).subscribe({
        next: (r) => {
          this.threads.set(r.items);
          this.hasNext.set(r.hasNext);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.forum.threads(this.categorySlug(), this.page + 1, ForumThreadsComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.page++;
        this.threads.update((list) => [...list, ...r.items]);
        this.hasNext.set(r.hasNext);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  create(): void {
    const title = this.title.trim();
    const body = this.body().trim();
    if (!title || !body) return;
    this.sending.set(true);
    this.forum.openThread(this.categorySlug(), title, body).subscribe({
      next: (t) => {
        this.sending.set(false);
        this.composing.set(false);
        this.title = '';
        this.body.set('');
        this.threadClick.emit(t.slug);
      },
      error: () => this.sending.set(false),
    });
  }

  cancel(): void {
    this.composing.set(false);
    this.title = '';
    this.body.set('');
  }
}
