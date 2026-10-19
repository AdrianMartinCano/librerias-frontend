import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ForumCategory, ForumService } from '../forum.service';

/**
 * Portada del foro: lista de categorías con sus contadores.
 * Emite `(categoryClick)` con el slug para que la app navegue a la categoría.
 */
@Component({
  selector: 'lib-forum-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="ff__muted">Cargando el foro…</p>
      }
      @case ('error') {
        <p class="ff__muted">No se pudo cargar el foro.</p>
      }
      @case ('ready') {
        <div class="ff">
          @for (c of categories(); track c.id) {
            <article class="ff-cat" (click)="categoryClick.emit(c.slug)"
                     tabindex="0" (keyup.enter)="categoryClick.emit(c.slug)">
              <div class="ff-cat__icon" [style.color]="c.color || null">{{ c.icon || '▣' }}</div>
              <div class="ff-cat__body">
                <h3 class="ff-cat__name">{{ c.name }}</h3>
                @if (c.description) {
                  <p class="ff-cat__desc">{{ c.description }}</p>
                }
              </div>
              <div class="ff-cat__count">
                <strong>{{ c.threadCount }}</strong>
                <span>{{ c.threadCount === 1 ? 'hilo' : 'hilos' }}</span>
              </div>
            </article>
          } @empty {
            <p class="ff__muted">Todavía no hay categorías.</p>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .ff { display: flex; flex-direction: column; gap: 0.9rem; }
      .ff__muted { color: var(--color-text-secondary, #5c5346); }
      .ff-cat {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1.1rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 5px;
        background: var(--color-surface, #fbf5e6);
        padding: 1rem 1.3rem;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .ff-cat:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(14, 58, 69, 0.12);
      }
      .ff-cat__icon {
        font-size: 1.8rem;
        color: var(--color-accent, #a87f3e);
      }
      .ff-cat__name {
        margin: 0;
        color: var(--color-primary, #0e3a45);
        font-size: 1.3rem;
      }
      .ff-cat__desc {
        margin: 0.25rem 0 0;
        color: var(--color-text, #2c2620);
        line-height: 1.5;
      }
      .ff-cat__count {
        text-align: center;
        color: var(--color-text-muted, #8a7f6d);
        font-size: 0.82rem;
      }
      .ff-cat__count strong {
        display: block;
        color: var(--color-accent, #a87f3e);
        font-size: 1.2rem;
      }
      @media (max-width: 560px) {
        .ff-cat { grid-template-columns: auto 1fr; }
        .ff-cat__count { grid-column: 2; text-align: left; }
      }
    `,
  ],
})
export class ForumCategoriesComponent {
  private readonly forum = inject(ForumService);

  readonly categoryClick = output<string>();
  readonly categories = signal<ForumCategory[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.forum.categories().subscribe({
      next: (c) => {
        this.categories.set(c);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }
}
