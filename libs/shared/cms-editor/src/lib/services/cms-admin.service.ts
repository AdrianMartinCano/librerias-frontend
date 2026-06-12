import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CmsPageDetail, CmsPageSummary, SaveCmsPageRequest } from '../models/cms-admin.models';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CmsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/cms/pages';

  list(): Observable<CmsPageSummary[]> {
    return this.http.get<ApiResponse<CmsPageSummary[]>>(this.base).pipe(map(r => r.data));
  }

  get(id: string): Observable<CmsPageDetail> {
    return this.http.get<ApiResponse<CmsPageDetail>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(req: SaveCmsPageRequest): Observable<CmsPageDetail> {
    return this.http.post<ApiResponse<CmsPageDetail>>(this.base, req).pipe(map(r => r.data));
  }

  update(id: string, req: SaveCmsPageRequest): Observable<CmsPageDetail> {
    return this.http.put<ApiResponse<CmsPageDetail>>(`${this.base}/${id}`, req).pipe(map(r => r.data));
  }

  togglePublished(id: string): Observable<CmsPageDetail> {
    return this.http.patch<ApiResponse<CmsPageDetail>>(`${this.base}/${id}/toggle-published`, null).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
