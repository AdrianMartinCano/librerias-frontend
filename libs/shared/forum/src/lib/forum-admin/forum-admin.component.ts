import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumCategory, ForumReport, ForumService } from '../forum.service';

/**
 * Panel de administración del foro: gestión de categorías y cola de denuncias.
 * Emite `(openThread)` con el slug del hilo para abrir un mensaje denunciado.
 */
@Component({
  selector: 'lib-forum-admin',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fa">
      <h3 class="fa__h3">Categorías</h3>

      <form class="fa__newcat" (ngSubmit)="createCategory()">
        <input [(ngModel)]="newName" name="newname" placeholder="Nombre de la categoría" [disabled]="busy()" />
        <input [(ngModel)]="newDesc" name="newdesc" placeholder="Descripción (opcional)" [disabled]="busy()" />
        <button type="submit" [disabled]="busy() || !newName.trim()">Crear</button>
      </form>

      <div class="fa__cats">
        @for (c of categories(); track c.id) {
          <div class="fa-cat">
            <div class="fa-cat__info">
              <strong>{{ c.name }}</strong>
              <span class="fa-cat__count">{{ c.threadCount }} {{ c.threadCount === 1 ? 'hilo' : 'hilos' }}</span>
              @if (c.description) { <span class="fa-cat__desc">{{ c.description }}</span> }
            </div>
            <button type="button" class="fa-cat__del" (click)="deleteCategory(c)" title="Borrar categoría">✕</button>
          </div>
        } @empty {
          <p class="fa__muted">No hay categorías. Crea la primera arriba.</p>
        }
      </div>

      <h3 class="fa__h3">Denuncias pendientes</h3>
      <div class="fa__reports">
        @for (r of reports(); track r.id) {
          <div class="fa-rep">
            <div class="fa-rep__info">
              <p class="fa-rep__preview">“{{ r.postPreview }}”</p>
              <p class="fa-rep__meta">
                denunciado por <strong>{{ r.reporterName }}</strong>
                @if (r.reason) { · motivo: {{ r.reason }} }
              </p>
            </div>
            <div class="fa-rep__actions">
              @if (r.threadSlug) {
                <button type="button" (click)="openThread.emit(r.threadSlug)">Ver</button>
              }
              <button type="button" class="fa-rep__del" (click)="deletePost(r)">Borrar mensaje</button>
              <button type="button" (click)="resolve(r)">Resolver</button>
            </div>
          </div>
        } @empty {
          <p class="fa__muted">No hay denuncias pendientes. ✦</p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .fa__h3 { color: var(--color-primary, #0e3a45); margin: 1.5rem 0 0.8rem; }
      .fa__muted { color: var(--color-text-secondary, #5c5346); }
      .fa__newcat { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
      .fa__newcat input {
        flex: 1; min-width: 160px; padding: 0.5rem 0.7rem;
        border: 1px solid var(--color-border, #cdbf9f); border-radius: 4px; font: inherit;
      }
      .fa__newcat button, .fa-rep__actions button {
        background: var(--color-primary, #0e3a45); color: var(--color-text-on-primary, #f4ecd8);
        border: 0; padding: 0.5rem 1rem; border-radius: 3px; font-weight: 600; cursor: pointer;
      }
      .fa__newcat button:disabled { opacity: 0.6; cursor: default; }
      .fa__cats, .fa__reports { display: flex; flex-direction: column; gap: 0.5rem; }
      .fa-cat, .fa-rep {
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        border: 1px solid var(--color-border, #cdbf9f); border-radius: 4px;
        background: var(--color-surface, #fbf5e6); padding: 0.7rem 1rem;
      }
      .fa-cat__count { color: var(--color-text-muted, #8a7f6d); font-size: 0.82rem; margin-left: 0.6rem; }
      .fa-cat__desc { display: block; color: var(--color-text-secondary, #5c5346); font-size: 0.85rem; margin-top: 0.2rem; }
      .fa-cat__del {
        background: transparent; border: 0; color: var(--color-danger, #b14b43);
        cursor: pointer; font-size: 1rem;
      }
      .fa-rep { align-items: flex-start; }
      .fa-rep__preview { margin: 0; color: var(--color-text, #2c2620); font-style: italic; }
      .fa-rep__meta { margin: 0.3rem 0 0; font-size: 0.82rem; color: var(--color-text-muted, #8a7f6d); }
      .fa-rep__actions { display: flex; gap: 0.4rem; flex-wrap: wrap; white-space: nowrap; }
      .fa-rep__actions button { font-size: 0.82rem; padding: 0.4rem 0.7rem; }
      .fa-rep__del { background: var(--color-danger, #b14b43) !important; }
    `,
  ],
})
export class ForumAdminComponent {
  private readonly forum = inject(ForumService);

  readonly openThread = output<string>();
  readonly categories = signal<ForumCategory[]>([]);
  readonly reports = signal<ForumReport[]>([]);
  readonly busy = signal(false);

  newName = '';
  newDesc = '';

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.forum.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.forum.adminReports(true).subscribe({ next: (r) => this.reports.set(r), error: () => {} });
  }

  createCategory(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.busy.set(true);
    this.forum.adminCreateCategory({ name, description: this.newDesc.trim() || undefined }).subscribe({
      next: (c) => {
        this.categories.update((list) => [...list, c]);
        this.newName = '';
        this.newDesc = '';
        this.busy.set(false);
      },
      error: () => this.busy.set(false),
    });
  }

  deleteCategory(c: ForumCategory): void {
    let force = false;
    if (c.threadCount > 0) {
      if (!confirm(`«${c.name}» tiene ${c.threadCount} hilo(s). ¿Borrarla con TODO su contenido?`)) return;
      force = true;
    } else if (!confirm(`¿Borrar la categoría «${c.name}»?`)) {
      return;
    }
    this.forum.adminDeleteCategory(c.id, force).subscribe({
      next: () => this.categories.update((list) => list.filter((x) => x.id !== c.id)),
      error: () => {},
    });
  }

  deletePost(r: ForumReport): void {
    if (!confirm('¿Borrar el mensaje denunciado?')) return;
    this.forum.adminDeletePost(r.postId).subscribe({
      // El back borra en cascada la(s) denuncia(s) de ese mensaje, así que las
      // quitamos de la lista directamente (sin llamar a "resolver", que daría 404
      // al haber dejado de existir). Filtramos por postId por si había varias.
      next: () => this.reports.update((list) => list.filter((x) => x.postId !== r.postId)),
      error: () => {},
    });
  }

  resolve(r: ForumReport): void {
    this.forum.adminResolveReport(r.id).subscribe({
      next: () => this.reports.update((list) => list.filter((x) => x.id !== r.id)),
      error: () => {},
    });
  }
}
