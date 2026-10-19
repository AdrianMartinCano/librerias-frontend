import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
}

export interface BlogPost extends BlogPostSummary {
  body: string;
  createdAt: string;
}

export interface BlogComment {
  id: string;
  authorName: string;
  authorIsAdmin: boolean;
  body: string;
  createdAt: string;
}

export interface SaveBlogPost {
  title: string;
  excerpt?: string;
  body: string;
  coverImage?: string;
  tags?: string[];
  published: boolean;
}

interface ApiResponse<T> {
  data: T;
}
interface PageResponse<T> {
  items: T[];
  total: number;
  hasNext: boolean;
}

/**
 * Acceso a la API del blog (módulo spring-blog). Rutas relativas; el JWT lo
 * añade el interceptor de la app consumidora.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  // ── Público ─────────────────────────────────────────────────────────
  listPublished(page = 0, size = 10): Observable<{ items: BlogPostSummary[]; hasNext: boolean }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<BlogPostSummary>>>('/api/blog/posts', { params })
      .pipe(map((r) => ({ items: r.data?.items ?? [], hasNext: r.data?.hasNext ?? false })));
  }

  getBySlug(slug: string): Observable<BlogPost> {
    return this.http
      .get<ApiResponse<BlogPost>>(`/api/blog/posts/${slug}`)
      .pipe(map((r) => r.data));
  }

  comments(slug: string): Observable<BlogComment[]> {
    return this.http
      .get<ApiResponse<BlogComment[]>>(`/api/blog/posts/${slug}/comments`)
      .pipe(map((r) => r.data ?? []));
  }

  addComment(slug: string, body: string): Observable<BlogComment> {
    return this.http
      .post<ApiResponse<BlogComment>>(`/api/blog/posts/${slug}/comments`, { body })
      .pipe(map((r) => r.data));
  }

  /** Borra un comentario (moderación admin). */
  deleteComment(commentId: string): Observable<unknown> {
    return this.http.delete(`/api/admin/blog/comments/${commentId}`);
  }

  /**
   * Sube una imagen al endpoint de storage y devuelve su URL pública.
   * Por defecto usa /api/files/upload (convención de spring-storage).
   */
  uploadImage(file: File, uploadUrl = '/api/files/upload', subdir = 'blog'): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('subdir', subdir);
    return this.http
      .post<ApiResponse<{ url: string }>>(uploadUrl, form)
      .pipe(map((r) => r.data.url));
  }

  // ── Admin ───────────────────────────────────────────────────────────
  adminList(): Observable<BlogPostSummary[]> {
    return this.http
      .get<ApiResponse<PageResponse<BlogPostSummary>>>('/api/admin/blog/posts?size=100')
      .pipe(map((r) => r.data?.items ?? []));
  }

  adminGet(id: string): Observable<BlogPost> {
    return this.http
      .get<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}`)
      .pipe(map((r) => r.data));
  }

  adminCreate(post: SaveBlogPost): Observable<BlogPost> {
    return this.http
      .post<ApiResponse<BlogPost>>('/api/admin/blog/posts', post)
      .pipe(map((r) => r.data));
  }

  adminUpdate(id: string, post: SaveBlogPost): Observable<BlogPost> {
    return this.http
      .put<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}`, post)
      .pipe(map((r) => r.data));
  }

  adminDelete(id: string): Observable<unknown> {
    return this.http.delete(`/api/admin/blog/posts/${id}`);
  }
}
