import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// ── Tipos (espejo de los DTOs de spring-forum) ────────────────────────────────

export interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  icon: string | null;
  color: string | null;
  threadCount: number;
}

export interface SaveForumCategory {
  name: string;
  description?: string;
  position?: number;
  icon?: string;
  color?: string;
}

export interface ForumThreadSummary {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categorySlug: string | null;
  authorName: string;
  authorIsAdmin: boolean;
  pinned: boolean;
  locked: boolean;
  replyCount: number;
  viewCount: number;
  lastPostAt: string | null;
  lastPostAuthorName: string | null;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categorySlug: string | null;
  categoryName: string | null;
  authorName: string;
  authorIsAdmin: boolean;
  pinned: boolean;
  locked: boolean;
  replyCount: number;
  viewCount: number;
  createdAt: string;
}

export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'THANKS';

export interface ReactionCount {
  type: ReactionType;
  count: number;
  reacted: boolean;
}

export interface QuotedPost {
  id: string;
  authorName: string;
  body: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorIsAdmin: boolean;
  body: string;
  opening: boolean;
  quoted: QuotedPost | null;
  reactions: ReactionCount[];
  editedAt: string | null;
  createdAt: string;
}

export interface ForumNotification {
  id: string;
  type: 'REPLY' | 'QUOTE' | 'REACTION';
  actorName: string;
  threadSlug: string | null;
  threadTitle: string | null;
  postId: string | null;
  read: boolean;
  createdAt: string;
}

export interface ForumReport {
  id: string;
  postId: string;
  threadId: string | null;
  threadSlug: string | null;
  reporterName: string;
  reason: string | null;
  status: 'OPEN' | 'RESOLVED';
  postPreview: string;
  createdAt: string;
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
 * Acceso a la API del foro (módulo spring-forum). Rutas relativas; el JWT lo
 * añade el interceptor de la app consumidora.
 */
@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly http = inject(HttpClient);

  // ── Categorías ──────────────────────────────────────────────────────────
  categories(): Observable<ForumCategory[]> {
    return this.http
      .get<ApiResponse<ForumCategory[]>>('/api/forum/categories')
      .pipe(map((r) => r.data ?? []));
  }

  // ── Hilos ───────────────────────────────────────────────────────────────
  threads(
    categorySlug: string,
    page = 0,
    size = 20,
  ): Observable<{ items: ForumThreadSummary[]; hasNext: boolean }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<ForumThreadSummary>>>(
        `/api/forum/categories/${categorySlug}/threads`,
        { params },
      )
      .pipe(map((r) => ({ items: r.data?.items ?? [], hasNext: r.data?.hasNext ?? false })));
  }

  thread(slug: string): Observable<ForumThread> {
    return this.http
      .get<ApiResponse<ForumThread>>(`/api/forum/threads/${slug}`)
      .pipe(map((r) => r.data));
  }

  posts(
    slug: string,
    page = 0,
    size = 20,
  ): Observable<{ items: ForumPost[]; hasNext: boolean }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<ForumPost>>>(`/api/forum/threads/${slug}/posts`, { params })
      .pipe(map((r) => ({ items: r.data?.items ?? [], hasNext: r.data?.hasNext ?? false })));
  }

  openThread(categorySlug: string, title: string, body: string): Observable<ForumThread> {
    return this.http
      .post<ApiResponse<ForumThread>>(`/api/forum/categories/${categorySlug}/threads`, { title, body })
      .pipe(map((r) => r.data));
  }

  reply(slug: string, body: string, quotedPostId?: string): Observable<ForumPost> {
    return this.http
      .post<ApiResponse<ForumPost>>(`/api/forum/threads/${slug}/posts`, { body, quotedPostId })
      .pipe(map((r) => r.data));
  }

  editPost(postId: string, body: string): Observable<ForumPost> {
    return this.http
      .put<ApiResponse<ForumPost>>(`/api/forum/posts/${postId}`, { body })
      .pipe(map((r) => r.data));
  }

  deletePost(postId: string): Observable<unknown> {
    return this.http.delete(`/api/forum/posts/${postId}`);
  }

  // ── Reacciones / denuncias ──────────────────────────────────────────────
  react(postId: string, type: ReactionType): Observable<ReactionCount[]> {
    return this.http
      .post<ApiResponse<ReactionCount[]>>(`/api/forum/posts/${postId}/reactions`, { type })
      .pipe(map((r) => r.data ?? []));
  }

  report(postId: string, reason: string): Observable<unknown> {
    return this.http.post(`/api/forum/posts/${postId}/report`, { reason });
  }

  // ── Búsqueda ────────────────────────────────────────────────────────────
  search(q: string, page = 0, size = 20): Observable<{ items: ForumThreadSummary[]; hasNext: boolean }> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<ForumThreadSummary>>>('/api/forum/search', { params })
      .pipe(map((r) => ({ items: r.data?.items ?? [], hasNext: r.data?.hasNext ?? false })));
  }

  // ── Notificaciones ──────────────────────────────────────────────────────
  notifications(page = 0, size = 20): Observable<{ items: ForumNotification[]; hasNext: boolean }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<ForumNotification>>>('/api/forum/notifications', { params })
      .pipe(map((r) => ({ items: r.data?.items ?? [], hasNext: r.data?.hasNext ?? false })));
  }

  unreadCount(): Observable<number> {
    return this.http
      .get<ApiResponse<{ count: number }>>('/api/forum/notifications/unread-count')
      .pipe(map((r) => r.data?.count ?? 0));
  }

  markNotificationRead(id: string): Observable<unknown> {
    return this.http.post(`/api/forum/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<unknown> {
    return this.http.post('/api/forum/notifications/read-all', {});
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  adminCreateCategory(c: SaveForumCategory): Observable<ForumCategory> {
    return this.http
      .post<ApiResponse<ForumCategory>>('/api/admin/forum/categories', c)
      .pipe(map((r) => r.data));
  }

  adminUpdateCategory(id: string, c: SaveForumCategory): Observable<ForumCategory> {
    return this.http
      .put<ApiResponse<ForumCategory>>(`/api/admin/forum/categories/${id}`, c)
      .pipe(map((r) => r.data));
  }

  adminDeleteCategory(id: string, force = false): Observable<unknown> {
    const params = new HttpParams().set('force', force);
    return this.http.delete(`/api/admin/forum/categories/${id}`, { params });
  }

  adminMoveThread(threadId: string, categoryId: string): Observable<unknown> {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.post(`/api/admin/forum/threads/${threadId}/move`, {}, { params });
  }

  adminPinThread(threadId: string, value: boolean): Observable<unknown> {
    const params = new HttpParams().set('value', value);
    return this.http.post(`/api/admin/forum/threads/${threadId}/pin`, {}, { params });
  }

  adminLockThread(threadId: string, value: boolean): Observable<unknown> {
    const params = new HttpParams().set('value', value);
    return this.http.post(`/api/admin/forum/threads/${threadId}/lock`, {}, { params });
  }

  adminDeleteThread(threadId: string): Observable<unknown> {
    return this.http.delete(`/api/admin/forum/threads/${threadId}`);
  }

  adminDeletePost(postId: string): Observable<unknown> {
    return this.http.delete(`/api/admin/forum/posts/${postId}`);
  }

  adminReports(onlyOpen = true): Observable<ForumReport[]> {
    const params = new HttpParams().set('onlyOpen', onlyOpen).set('size', 100);
    return this.http
      .get<ApiResponse<PageResponse<ForumReport>>>('/api/admin/forum/reports', { params })
      .pipe(map((r) => r.data?.items ?? []));
  }

  adminResolveReport(id: string): Observable<unknown> {
    return this.http.post(`/api/admin/forum/reports/${id}/resolve`, {});
  }
}
