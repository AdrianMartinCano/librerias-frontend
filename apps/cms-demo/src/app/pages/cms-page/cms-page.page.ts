import { Component, ChangeDetectionStrategy, inject, signal, OnInit, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CmsPageComponent } from '@org/cms';
import { CmsPage } from '@org/models';

interface ApiResponse<T> { data: T; }

@Component({
  selector: 'app-cms-page',
  standalone: true,
  imports: [CmsPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="page-state">
        <div class="spinner"></div>
        <span>Cargando...</span>
      </div>
    } @else if (error()) {
      <div class="page-state page-state--error">
        <span>⚠️ Página no encontrada</span>
        <small>Slug: <code>{{ slug() }}</code></small>
      </div>
    } @else if (page()) {
      <lib-cms-page [page]="page()!" />
    }
  `,
})
export class CmsPagePage implements OnInit {
  private http = inject(HttpClient);

  readonly slug = input.required<string>();

  readonly page    = signal<CmsPage | null>(null);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<ApiResponse<CmsPage>>(`/api/cms/pages/${this.slug()}`).subscribe({
      next:  res => { this.page.set(res.data); this.loading.set(false); },
      error: err => { this.error.set(err?.message ?? 'No encontrado'); this.loading.set(false); },
    });
  }
}
