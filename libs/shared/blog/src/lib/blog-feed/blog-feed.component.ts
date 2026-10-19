import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { BlogPostSummary, BlogService } from '../blog.service';

/**
 * Feed del blog: lista los posts publicados (más recientes primero).
 * Emite `(postClick)` con el slug para que la app navegue al detalle.
 */
@Component({
  selector: 'lib-blog-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="blog-feed__muted">Cargando entradas…</p>
      }
      @case ('error') {
        <p class="blog-feed__muted">No se pudieron cargar las entradas.</p>
      }
      @case ('ready') {
        <div class="blog-feed">
          @for (p of posts(); track p.id) {
            <article class="blog-card" [class.blog-card--sin-imagen]="!p.coverImage"
                     (click)="postClick.emit(p.slug)"
                     tabindex="0" (keyup.enter)="postClick.emit(p.slug)">
              @if (p.coverImage) {
                <img class="blog-card__img" [src]="p.coverImage" [alt]="p.title" />
              }
              <div class="blog-card__body">
                @if (p.publishedAt) {
                  <time class="blog-card__date">{{ p.publishedAt.slice(0, 10) }}</time>
                }
                <h3 class="blog-card__title">{{ p.title }}</h3>
                @if (p.excerpt) {
                  <p class="blog-card__excerpt">{{ p.excerpt }}</p>
                }
                <span class="blog-card__more">Leer →</span>
              </div>
            </article>
          } @empty {
            <p class="blog-feed__muted">Todavía no hay entradas.</p>
          }
        </div>
        @if (hasNext()) {
          <button type="button" class="blog-feed__more" (click)="loadMore()" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Cargando…' : 'Cargar más entradas' }}
          </button>
        }
      }
    }
  `,
  styles: [
    `
      .blog-feed {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }
      .blog-feed__muted {
        color: var(--color-text-secondary, #5c5346);
      }
      .blog-card {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 1.2rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 5px;
        background: var(--color-surface, #fbf5e6);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      /* Sin portada no hay primera columna que llenar: con el grid de dos columnas
         el texto caía en la tira de 160px y el resto de la tarjeta se quedaba
         vacío. A todo el ancho se lee como una nota, que es lo que es. */
      .blog-card--sin-imagen {
        grid-template-columns: 1fr;
      }
      .blog-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(14, 58, 69, 0.12);
      }
      .blog-card__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .blog-card__body {
        padding: 1rem 1.2rem;
      }
      .blog-card__date {
        font-variant: small-caps;
        letter-spacing: 0.08em;
        color: var(--color-text-muted, #8a7f6d);
        font-size: 0.82rem;
      }
      .blog-card__title {
        margin: 0.2rem 0 0.4rem;
        color: var(--color-primary, #0e3a45);
        font-size: 1.5rem;
      }
      .blog-card__excerpt {
        margin: 0 0 0.6rem;
        line-height: 1.6;
        color: var(--color-text, #2c2620);
      }
      .blog-card__more {
        font-weight: 600;
        color: var(--color-accent, #15616d);
      }
      .blog-feed__more {
        display: block;
        margin: 1.6rem auto 0;
        background: transparent;
        border: 1px solid var(--color-accent, #a87f3e);
        color: var(--color-primary, #0e3a45);
        font-weight: 600;
        padding: 0.6rem 1.4rem;
        border-radius: 3px;
        cursor: pointer;
      }
      .blog-feed__more:hover { background: rgba(168, 127, 62, 0.08); }
      .blog-feed__more:disabled { opacity: 0.6; cursor: default; }

      @media (max-width: 640px) {
        .blog-card {
          grid-template-columns: 1fr;
        }
        .blog-card__img {
          max-height: 180px;
        }
      }
    `,
  ],
})
export class BlogFeedComponent {
  private readonly blog = inject(BlogService);

  readonly postClick = output<string>();
  readonly posts = signal<BlogPostSummary[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly hasNext = signal(false);
  readonly loadingMore = signal(false);

  /** Entradas por página (página 0 al cargar; el resto con "Cargar más"). */
  private page = 0;
  private static readonly PAGE_SIZE = 10;

  constructor() {
    this.blog.listPublished(0, BlogFeedComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.posts.set(r.items);
        this.hasNext.set(r.hasNext);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.blog.listPublished(this.page + 1, BlogFeedComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.page++;
        this.posts.update((list) => [...list, ...r.items]);
        this.hasNext.set(r.hasNext);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }
}
