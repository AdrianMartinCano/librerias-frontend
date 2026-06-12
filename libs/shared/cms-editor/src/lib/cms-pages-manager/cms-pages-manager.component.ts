import { Component, ChangeDetectionStrategy, inject, signal, OnInit, input } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { CmsAdminService } from '../services/cms-admin.service';
import { CmsPageDetail, CmsPageSummary, SaveCmsPageRequest } from '../models/cms-admin.models';
import { CmsPageBuilderComponent } from '../cms-page-builder/cms-page-builder.component';
import { CmsBlock } from '@org/models';

type View = 'list' | 'editor';

@Component({
  selector: 'lib-cms-pages-manager',
  standalone: true,
  imports: [CmsPageBuilderComponent, SlicePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cpm">
      @if (view() === 'list') {
        <div class="cpm__header">
          <h2 class="cpm__title">Páginas CMS</h2>
          <button type="button" class="cms-btn cms-btn--primary" (click)="newPage()">+ Nueva página</button>
        </div>

        @if (loading()) {
          <p class="cpm__state">Cargando...</p>
        } @else if (error()) {
          <p class="cpm__state cpm__state--error">{{ error() }}</p>
        } @else if (pages().length === 0) {
          <p class="cpm__state">No hay páginas. Crea la primera.</p>
        } @else {
          <table class="cpm__table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Actualizada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (page of pages(); track page.id) {
                <tr>
                  <td><code>/{{ page.slug }}</code></td>
                  <td>{{ page.title }}</td>
                  <td>
                    <span class="cpm__badge" [class.cpm__badge--published]="page.published">
                      {{ page.published ? 'Publicada' : 'Borrador' }}
                    </span>
                  </td>
                  <td>{{ page.updatedAt | slice:0:10 }}</td>
                  <td class="cpm__row-actions">
                    <button type="button" class="cms-btn cms-btn--secondary" (click)="editPage(page)">Editar</button>
                    <button type="button" class="cms-btn" (click)="togglePublished(page)">
                      {{ page.published ? 'Despublicar' : 'Publicar' }}
                    </button>
                    <button type="button" class="cms-btn cms-btn--danger" (click)="deletePage(page)">Eliminar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      @if (view() === 'editor') {
        <div class="cpm__editor-header">
          <button type="button" class="cms-btn cms-btn--secondary" (click)="backToList()">← Volver</button>
          <h2 class="cpm__title">{{ editingPage() ? 'Editar: ' + editingPage()!.title : 'Nueva página' }}</h2>
        </div>
        @if (saving()) { <p class="cpm__state">Guardando...</p> }
        @if (saveError()) { <p class="cpm__state cpm__state--error">{{ saveError() }}</p> }
        <lib-cms-page-builder
          [page]="editingPage()"
          [previewPath]="previewPath()"
          (saved)="onSaved($event)"
          (cancel)="backToList()"
        />
      }
    </div>
  `,
  styles: [`
    .cpm { font-family: var(--font-family, sans-serif); }
    .cpm__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .cpm__title { margin: 0; font-size: 1.25rem; }
    .cpm__state { color: var(--color-text-muted, #666); padding: 24px; text-align: center; }
    .cpm__state--error { color: #e53e3e; }
    .cpm__table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .cpm__table th, .cpm__table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--color-border, #eee); }
    .cpm__table th { font-weight: 600; color: var(--color-text-muted, #666); }
    .cpm__badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; background: var(--color-surface, #f5f5f5); color: var(--color-text-muted, #666); }
    .cpm__badge--published { background: #c6f6d5; color: #276749; }
    .cpm__row-actions { display: flex; gap: 6px; }
    .cpm__editor-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  `],
})
export class CmsPagesManagerComponent implements OnInit {
  private readonly service = inject(CmsAdminService);

  readonly previewPath = input('/cms-preview');

  readonly pages       = signal<CmsPageSummary[]>([]);
  readonly editingPage = signal<CmsPageDetail | null>(null);
  readonly view        = signal<View>('list');
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);
  readonly saving      = signal(false);
  readonly saveError   = signal<string | null>(null);

  ngOnInit(): void { this.loadPages(); }

  private loadPages(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next:  pages => { this.pages.set(pages); this.loading.set(false); },
      error: err   => { this.error.set(err?.message ?? 'Error al cargar'); this.loading.set(false); },
    });
  }

  newPage(): void {
    this.editingPage.set(null);
    this.view.set('editor');
  }

  editPage(summary: CmsPageSummary): void {
    this.service.get(summary.id).subscribe({
      next: page => { this.editingPage.set(page); this.view.set('editor'); },
    });
  }

  backToList(): void {
    this.view.set('list');
    this.editingPage.set(null);
  }

  onSaved(payload: { slug: string; title: string; description: string; blocks: CmsBlock[]; published: boolean }): void {
    const req: SaveCmsPageRequest = { ...payload };
    const id = this.editingPage()?.id;
    this.saving.set(true);
    this.saveError.set(null);

    const op = id ? this.service.update(id, req) : this.service.create(req);
    op.subscribe({
      next: () => { this.saving.set(false); this.loadPages(); this.backToList(); },
      error: err => { this.saveError.set(err?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  togglePublished(page: CmsPageSummary): void {
    this.service.togglePublished(page.id).subscribe({
      next: updated => this.pages.update(ps => ps.map(p => p.id === page.id ? { ...p, published: updated.published } : p)),
    });
  }

  deletePage(page: CmsPageSummary): void {
    if (!confirm(`¿Eliminar "${page.title}"?`)) return;
    this.service.delete(page.id).subscribe({
      next: () => this.pages.update(ps => ps.filter(p => p.id !== page.id)),
    });
  }
}
