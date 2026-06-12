import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CmsPageComponent } from '@org/cms';
import { CmsPage } from '@org/models';

interface ApiResponse<T> { data: T; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CmsPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="page-state">
        <div class="spinner"></div>
        <span>Cargando página...</span>
      </div>
    } @else if (error()) {
      <div class="page-state page-state--error">
        <span>⚠️ No se pudo cargar la página</span>
        <small>{{ error() }}</small>
        <small>¿Está el backend arrancado en localhost:8080?</small>
      </div>
    } @else if (page()) {
      <lib-cms-page [page]="page()!" />
    }
  `,
})
export class HomePage implements OnInit {
  private http = inject(HttpClient);

  readonly page    = signal<CmsPage | null>(null);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<ApiResponse<CmsPage>>('/api/cms/pages/home').subscribe({
      next:  res => { this.page.set(res.data); this.loading.set(false); },
      error: err => { this.error.set(err?.message ?? 'Error desconocido'); this.loading.set(false); },
    });
  }
}
