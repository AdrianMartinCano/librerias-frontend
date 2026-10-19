import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ForumNotification, ForumService } from '../forum.service';

/**
 * Bandeja de notificaciones del foro. Emite `(open)` con el slug del hilo al
 * pulsar una notificación (y la marca como leída).
 */
@Component({
  selector: 'lib-forum-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') { <p class="fn__muted">Cargando…</p> }
      @case ('error') { <p class="fn__muted">No se pudieron cargar las notificaciones.</p> }
      @case ('ready') {
        @if (items().length) {
          <div class="fn__head">
            <button type="button" class="fn__allread" (click)="markAllRead()">Marcar todas como leídas</button>
          </div>
        }
        <div class="fn">
          @for (n of items(); track n.id) {
            <button type="button" class="fn-row" [class.fn-row--unread]="!n.read" (click)="select(n)">
              <span class="fn-row__icon">{{ icon(n.type) }}</span>
              <span class="fn-row__text">
                <strong>{{ n.actorName }}</strong> {{ text(n.type) }}
                @if (n.threadTitle) { «{{ n.threadTitle }}» }
              </span>
              <span class="fn-row__date">{{ n.createdAt.slice(0, 10) }}</span>
            </button>
          } @empty {
            <p class="fn__muted">No tienes notificaciones.</p>
          }
        </div>
        @if (hasNext()) {
          <button type="button" class="fn__more" (click)="loadMore()" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Cargando…' : 'Cargar más' }}
          </button>
        }
      }
    }
  `,
  styles: [
    `
      .fn { display: flex; flex-direction: column; gap: 0.4rem; }
      .fn__muted { color: var(--color-text-secondary, #5c5346); }
      .fn__head { display: flex; justify-content: flex-end; margin-bottom: 0.6rem; }
      .fn__allread {
        background: transparent; border: 0; color: var(--color-accent, #15616d);
        cursor: pointer; font-size: 0.82rem;
      }
      .fn-row {
        display: flex; align-items: center; gap: 0.7rem; text-align: left; width: 100%;
        border: 1px solid var(--color-border, #cdbf9f); border-radius: 4px;
        background: var(--color-surface, #fbf5e6); padding: 0.7rem 0.9rem; cursor: pointer;
      }
      .fn-row--unread { border-left: 3px solid var(--color-accent, #a87f3e); font-weight: 500; }
      .fn-row__icon { font-size: 1.1rem; }
      .fn-row__text { flex: 1; color: var(--color-text, #2c2620); line-height: 1.4; }
      .fn-row__date { color: var(--color-text-muted, #8a7f6d); font-size: 0.8rem; white-space: nowrap; }
      .fn__more {
        display: block; margin: 1.2rem auto 0; background: transparent;
        border: 1px solid var(--color-accent, #a87f3e); color: var(--color-primary, #0e3a45);
        font-weight: 600; padding: 0.5rem 1.2rem; border-radius: 3px; cursor: pointer;
      }
      .fn__more:disabled { opacity: 0.6; cursor: default; }
    `,
  ],
})
export class ForumNotificationsComponent {
  private readonly forum = inject(ForumService);

  readonly open = output<string>();
  readonly items = signal<ForumNotification[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly hasNext = signal(false);
  readonly loadingMore = signal(false);

  private page = 0;
  private static readonly PAGE_SIZE = 20;

  constructor() {
    this.forum.notifications(0, ForumNotificationsComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.hasNext.set(r.hasNext);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.forum.notifications(this.page + 1, ForumNotificationsComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.page++;
        this.items.update((list) => [...list, ...r.items]);
        this.hasNext.set(r.hasNext);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  icon(type: ForumNotification['type']): string {
    return type === 'REPLY' ? '💬' : type === 'QUOTE' ? '❝' : '👍';
  }

  text(type: ForumNotification['type']): string {
    return type === 'REPLY'
      ? 'respondió en tu hilo'
      : type === 'QUOTE'
        ? 'citó tu mensaje en'
        : 'reaccionó a tu mensaje en';
  }

  select(n: ForumNotification): void {
    if (!n.read) {
      this.forum.markNotificationRead(n.id).subscribe({ next: () => {}, error: () => {} });
      this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.threadSlug) this.open.emit(n.threadSlug);
  }

  markAllRead(): void {
    this.forum.markAllNotificationsRead().subscribe({
      next: () => this.items.update((list) => list.map((x) => ({ ...x, read: true }))),
      error: () => {},
    });
  }
}
