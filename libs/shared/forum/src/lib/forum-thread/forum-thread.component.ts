import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  MarkdownEditorComponent,
  MarkdownPipe,
  StripMarkdownPipe,
} from '@org/markdown';
import {
  ForumPost,
  ForumService,
  ForumThread,
  ReactionCount,
  ReactionType,
} from '../forum.service';

interface ReactionDef {
  type: ReactionType;
  emoji: string;
  label: string;
}

/**
 * Detalle de un hilo: cabecera + mensajes paginados. Permite responder, citar,
 * reaccionar, editar/borrar mensajes propios, denunciar y (si es admin) moderar.
 * Inputs:
 *  - `slug`: qué hilo cargar.
 *  - `loggedIn`: si el visitante puede participar.
 *  - `currentUserId`: id del usuario (para saber qué mensajes son suyos).
 *  - `canModerate`: si es admin (fijar/cerrar/borrar de cualquiera).
 *  - `editWindowMinutes`: minutos para editar el propio mensaje (0 = sin límite).
 * Emite `(requireLogin)` y `(threadGone)` (al borrarse el hilo, para navegar fuera).
 */
@Component({
  selector: 'lib-forum-thread',
  imports: [MarkdownEditorComponent, MarkdownPipe, StripMarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') { <p class="ft__muted">Cargando…</p> }
      @case ('error') { <p class="ft__muted">No se pudo cargar el hilo.</p> }
      @case ('ready') {
        @if (thread(); as t) {
          <header class="fh">
            <h1 class="fh__title">
              @if (t.pinned) { <span title="Fijado">📌</span> }
              @if (t.locked) { <span title="Cerrado">🔒</span> }
              {{ t.title }}
            </h1>
            <p class="fh__meta">
              por <strong>{{ t.authorName }}</strong>
              @if (t.authorIsAdmin) { <span class="fbadge">★ Admin</span> }
              · {{ t.viewCount }} vistas
            </p>
            @if (canModerate()) {
              <div class="fh__mod">
                <button type="button" (click)="togglePin(t)">{{ t.pinned ? 'Desfijar' : 'Fijar' }}</button>
                <button type="button" (click)="toggleLock(t)">{{ t.locked ? 'Reabrir' : 'Cerrar' }}</button>
                <button type="button" class="fh__danger" (click)="deleteThread()">Borrar hilo</button>
              </div>
            }
          </header>

          <div class="fp-list">
            @for (p of posts(); track p.id) {
              <article class="fp" [class.fp--op]="p.opening">
                <div class="fp__head">
                  <strong>{{ p.authorName }}</strong>
                  @if (p.authorIsAdmin) { <span class="fbadge">★ Admin</span> }
                  <span class="fp__date">{{ p.createdAt.slice(0, 16).replace('T', ' ') }}</span>
                  @if (p.editedAt) { <span class="fp__edited" title="Editado">(editado)</span> }
                </div>

                @if (p.quoted; as q) {
                  <blockquote class="fp__quote">
                    <span class="fp__quote-author">{{ q.authorName }}:</span>
                    {{ q.body | libStripMarkdown }}
                  </blockquote>
                }

                @if (editingId() === p.id) {
                  <form class="fp__edit" (ngSubmit)="saveEdit(p)">
                    <lib-markdown-editor
                      [(value)]="editDraft" [rows]="4" [maxlength]="20000"
                      ariaLabel="Editar mensaje" />
                    <div class="fp__edit-foot">
                      <button type="button" (click)="editingId.set(null)">Cancelar</button>
                      <button type="submit" [disabled]="!editDraft().trim()">Guardar</button>
                    </div>
                  </form>
                } @else {
                  <div class="fp__body lib-md" [innerHTML]="p.body | libMarkdown"></div>
                }

                <div class="fp__actions">
                  @for (r of reactionDefs; track r.type) {
                    <button type="button" class="fp__react" [class.fp__react--on]="hasReacted(p, r.type)"
                            (click)="react(p, r.type)" [title]="r.label">
                      {{ r.emoji }} {{ countOf(p, r.type) || '' }}
                    </button>
                  }
                  <span class="fp__spacer"></span>
                  @if (loggedIn() && !thread()?.locked) {
                    <button type="button" class="fp__link" (click)="startQuote(p)">Citar</button>
                  }
                  @if (canEdit(p)) {
                    <button type="button" class="fp__link" (click)="startEdit(p)">Editar</button>
                  }
                  @if (canDelete(p)) {
                    <button type="button" class="fp__link fp__link--danger" (click)="removePost(p)">Borrar</button>
                  }
                  @if (loggedIn() && !isMine(p)) {
                    <button type="button" class="fp__link" (click)="reportPost(p)">Denunciar</button>
                  }
                </div>
              </article>
            }
          </div>

          @if (hasNext()) {
            <button type="button" class="fp__more" (click)="loadMore()" [disabled]="loadingMore()">
              {{ loadingMore() ? 'Cargando…' : 'Ver más mensajes' }}
            </button>
          }

          @if (loggedIn()) {
            @if (thread()?.locked) {
              <p class="fp__muted">🔒 Este hilo está cerrado. No admite más respuestas.</p>
            } @else {
              <form class="fp__reply" (ngSubmit)="send()">
                @if (quoting(); as q) {
                  <div class="fp__quoting">
                    Citando a <strong>{{ q.authorName }}</strong>
                    <button type="button" (click)="quoting.set(null)" title="Quitar cita">✕</button>
                  </div>
                }
                <lib-markdown-editor
                  [(value)]="draft" [rows]="4" [maxlength]="20000"
                  placeholder="Escribe tu respuesta…" ariaLabel="Tu respuesta"
                  [disabled]="sending()" />
                <div class="fp__reply-foot">
                  <button type="submit" [disabled]="sending() || !draft().trim()">
                    {{ sending() ? 'Enviando…' : 'Responder' }}
                  </button>
                </div>
              </form>
            }
          } @else {
            <p class="fp__login">
              <a href="javascript:void(0)" (click)="requireLogin.emit()">Inicia sesión</a> para participar.
            </p>
          }
        }
      }
    }
  `,
  styles: [
    `
      .ft__muted, .fp__muted { color: var(--color-text-secondary, #5c5346); }
      .fh { border-bottom: 1px solid var(--color-border, #cdbf9f); padding-bottom: 1rem; margin-bottom: 1.4rem; }
      .fh__title { margin: 0; color: var(--color-primary, #0e3a45); font-size: clamp(1.6rem, 4vw, 2.3rem); }
      .fh__meta { margin: 0.4rem 0 0; color: var(--color-text-muted, #8a7f6d); font-size: 0.9rem; }
      .fh__mod { display: flex; gap: 0.5rem; margin-top: 0.8rem; }
      .fh__mod button {
        background: transparent; border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 3px; padding: 0.3rem 0.7rem; cursor: pointer; font-size: 0.85rem;
      }
      .fh__danger, .fp__link--danger { color: var(--color-danger, #b14b43); }
      .fbadge {
        font-size: 0.68rem; font-weight: 700; font-variant: small-caps;
        color: var(--color-text-on-primary, #f4ecd8); background: var(--color-accent, #a87f3e);
        border-radius: 2px; padding: 0.05rem 0.35rem;
      }
      .fp-list { display: flex; flex-direction: column; gap: 0.8rem; }
      .fp {
        border: 1px solid var(--color-border, #cdbf9f); border-radius: 5px;
        background: var(--color-surface, #fbf5e6); padding: 0.9rem 1.1rem;
      }
      .fp--op { border-left: 3px solid var(--color-accent, #a87f3e); }
      .fp__head { display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary, #0e3a45); }
      .fp__date { color: var(--color-text-muted, #8a7f6d); font-size: 0.8rem; margin-left: auto; }
      .fp__edited { color: var(--color-text-muted, #8a7f6d); font-size: 0.78rem; font-style: italic; }
      .fp__quote {
        margin: 0.6rem 0; padding: 0.5rem 0.8rem; border-left: 3px solid var(--color-border, #cdbf9f);
        background: rgba(0, 0, 0, 0.03); color: var(--color-text-secondary, #5c5346); font-size: 0.92rem;
      }
      .fp__quote-author { font-weight: 600; }
      /* El formato del contenido lo pone .lib-md (global, en el theme): el HTML
         que entra por [innerHTML] no recibe la encapsulación del componente. */
      .fp__body { margin: 0.6rem 0 0.8rem; line-height: 1.65; }
      .fp__actions { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
      .fp__spacer { flex: 1; }
      .fp__react {
        background: transparent; border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 14px; padding: 0.15rem 0.6rem; cursor: pointer; font-size: 0.85rem;
      }
      .fp__react--on { background: var(--color-accent, #a87f3e); color: var(--color-text-on-primary, #f4ecd8); border-color: transparent; }
      .fp__link {
        background: transparent; border: 0; color: var(--color-accent, #15616d);
        cursor: pointer; font-size: 0.82rem; padding: 0.15rem 0.35rem;
      }
      .fp__more {
        display: block; margin: 1rem auto; background: transparent;
        border: 1px solid var(--color-accent, #a87f3e); color: var(--color-primary, #0e3a45);
        font-weight: 600; padding: 0.5rem 1.1rem; border-radius: 3px; cursor: pointer;
      }
      .fp__reply, .fp__edit { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.2rem; }
      .fp__edit { margin-top: 0.6rem; }
      .fp__reply-foot, .fp__edit-foot { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; }
      .fp__reply button[type='submit'], .fp__edit button[type='submit'] {
        background: var(--color-primary, #0e3a45); color: var(--color-text-on-primary, #f4ecd8);
        border: 0; padding: 0.55rem 1.3rem; border-radius: 3px; font-weight: 600; cursor: pointer;
      }
      .fp__edit-foot button[type='button'] {
        background: transparent; border: 1px solid var(--color-border, #cdbf9f);
        border-radius: 3px; padding: 0.5rem 0.9rem; cursor: pointer;
      }
      .fp__reply button:disabled, .fp__edit button:disabled { opacity: 0.6; cursor: default; }
      .fp__quoting {
        display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
        color: var(--color-text-secondary, #5c5346);
      }
      .fp__quoting button { background: transparent; border: 0; cursor: pointer; color: var(--color-danger, #b14b43); }
      .fp__login a { color: var(--color-accent, #15616d); font-weight: 600; }
    `,
  ],
})
export class ForumThreadComponent {
  private readonly forum = inject(ForumService);

  readonly slug = input.required<string>();
  readonly loggedIn = input(false);
  readonly currentUserId = input<string | null>(null);
  readonly canModerate = input(false);
  readonly editWindowMinutes = input(15);

  readonly requireLogin = output<void>();
  readonly threadGone = output<void>();
  /** Emite el hilo al cargarse (para que el host pinte un breadcrumb, etc.). */
  readonly loaded = output<ForumThread>();

  readonly thread = signal<ForumThread | null>(null);
  readonly posts = signal<ForumPost[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly hasNext = signal(false);
  readonly loadingMore = signal(false);
  readonly sending = signal(false);
  readonly quoting = signal<ForumPost | null>(null);
  readonly editingId = signal<string | null>(null);

  readonly reactionDefs: ReactionDef[] = [
    { type: 'LIKE', emoji: '👍', label: 'Me gusta' },
    { type: 'LOVE', emoji: '❤️', label: 'Me encanta' },
    { type: 'LAUGH', emoji: '😄', label: 'Me divierte' },
    { type: 'THANKS', emoji: '🙏', label: 'Gracias' },
  ];

  /** Markdown en crudo del editor: lo que se manda al backend tal cual. */
  readonly draft = signal('');
  readonly editDraft = signal('');
  private page = 0;
  private static readonly PAGE_SIZE = 20;

  constructor() {
    effect(() => {
      const s = this.slug();
      if (!s) return;
      this.page = 0;
      this.state.set('loading');
      this.forum.thread(s).subscribe({
        next: (t) => {
          this.thread.set(t);
          this.loaded.emit(t);
          this.loadPosts(s, 0, true);
        },
        error: () => this.state.set('error'),
      });
    });
  }

  private loadPosts(slug: string, page: number, replace: boolean): void {
    this.forum.posts(slug, page, ForumThreadComponent.PAGE_SIZE).subscribe({
      next: (r) => {
        this.posts.update((list) => (replace ? r.items : [...list, ...r.items]));
        this.hasNext.set(r.hasNext);
        this.state.set('ready');
        this.loadingMore.set(false);
      },
      error: () => {
        this.state.set(replace ? 'error' : 'ready');
        this.loadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.page++;
    this.loadPosts(this.slug(), this.page, false);
  }

  // ── Helpers de permisos / reacciones ──────────────────────────────────
  isMine(p: ForumPost): boolean {
    const uid = this.currentUserId();
    return !!uid && p.authorId === uid;
  }

  canDelete(p: ForumPost): boolean {
    return this.canModerate() || this.isMine(p);
  }

  canEdit(p: ForumPost): boolean {
    if (this.canModerate()) return true;
    if (!this.isMine(p)) return false;
    const win = this.editWindowMinutes();
    if (win <= 0) return true;
    return Date.now() - new Date(p.createdAt).getTime() <= win * 60_000;
  }

  countOf(p: ForumPost, type: ReactionType): number {
    return p.reactions.find((r) => r.type === type)?.count ?? 0;
  }

  hasReacted(p: ForumPost, type: ReactionType): boolean {
    return p.reactions.find((r) => r.type === type)?.reacted ?? false;
  }

  // ── Acciones ──────────────────────────────────────────────────────────
  react(p: ForumPost, type: ReactionType): void {
    if (!this.loggedIn()) { this.requireLogin.emit(); return; }
    this.forum.react(p.id, type).subscribe({
      next: (reactions: ReactionCount[]) => this.patchPost(p.id, { reactions }),
      error: () => {},
    });
  }

  startQuote(p: ForumPost): void {
    this.quoting.set(p);
    document.querySelector('.fp__reply')?.scrollIntoView({ behavior: 'smooth' });
  }

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.sending.set(true);
    this.forum.reply(this.slug(), text, this.quoting()?.id).subscribe({
      next: (post) => {
        this.posts.update((list) => [...list, post]);
        this.draft.set('');
        this.quoting.set(null);
        this.sending.set(false);
        const t = this.thread();
        if (t) this.thread.set({ ...t, replyCount: t.replyCount + 1 });
      },
      error: () => this.sending.set(false),
    });
  }

  startEdit(p: ForumPost): void {
    this.editingId.set(p.id);
    this.editDraft.set(p.body);
  }

  saveEdit(p: ForumPost): void {
    const text = this.editDraft().trim();
    if (!text) return;
    this.forum.editPost(p.id, text).subscribe({
      next: (updated) => {
        this.patchPost(p.id, { body: updated.body, editedAt: updated.editedAt });
        this.editingId.set(null);
      },
      error: () => {},
    });
  }

  removePost(p: ForumPost): void {
    const msg = p.opening
      ? '¿Borrar el mensaje de apertura? Se borrará el hilo entero.'
      : '¿Borrar este mensaje?';
    if (!confirm(msg)) return;
    const del = this.canModerate() && !this.isMine(p)
      ? this.forum.adminDeletePost(p.id)
      : this.forum.deletePost(p.id);
    del.subscribe({
      next: () => {
        if (p.opening) { this.threadGone.emit(); return; }
        this.posts.update((list) => list.filter((x) => x.id !== p.id));
        const t = this.thread();
        if (t) this.thread.set({ ...t, replyCount: Math.max(0, t.replyCount - 1) });
      },
      error: () => {},
    });
  }

  reportPost(p: ForumPost): void {
    const reason = (prompt('¿Por qué denuncias este mensaje? (obligatorio)') ?? '').trim();
    if (!reason) return; // el motivo es obligatorio: no se denuncia sin explicar por qué
    this.forum.report(p.id, reason).subscribe({
      next: () => alert('Gracias, lo revisaremos.'),
      error: () => {},
    });
  }

  togglePin(t: ForumThread): void {
    this.forum.adminPinThread(t.id, !t.pinned).subscribe({
      next: () => this.thread.set({ ...t, pinned: !t.pinned }),
      error: () => {},
    });
  }

  toggleLock(t: ForumThread): void {
    this.forum.adminLockThread(t.id, !t.locked).subscribe({
      next: () => this.thread.set({ ...t, locked: !t.locked }),
      error: () => {},
    });
  }

  deleteThread(): void {
    const t = this.thread();
    if (!t || !confirm('¿Borrar el hilo entero con todos sus mensajes?')) return;
    this.forum.adminDeleteThread(t.id).subscribe({
      next: () => this.threadGone.emit(),
      error: () => {},
    });
  }

  private patchPost(id: string, patch: Partial<ForumPost>): void {
    this.posts.update((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
}
