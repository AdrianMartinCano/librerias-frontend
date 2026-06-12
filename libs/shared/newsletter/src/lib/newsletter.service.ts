import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface NewsletterConfig {
  /** Dominio base de la API propia (p.ej. 'https://api.midominio.com'). Vacío = misma URL que el frontend. */
  apiUrl?: string;
  /** Endpoint de suscripción. Por defecto '/api/newsletter/subscribe'. */
  subscribeEndpoint?: string;
  /** Clave de localStorage usada para recordar que el popup ya se cerró. */
  popupDismissKey?: string;
  /** Días que el popup permanece oculto tras cerrarse antes de volver a mostrarse. Por defecto 30. */
  popupDismissTtlDays?: number;
}

export interface NewsletterSubscribeResponse {
  success: boolean;
  message?: string;
  alreadySubscribed?: boolean;
}

export type NewsletterSubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed';

export interface NewsletterSubscriberAdmin {
  [key: string]: unknown;
  id: string;
  email: string;
  source: string | null;
  status: NewsletterSubscriberStatus;
  createdAt: string;
  confirmedAt: string | null;
}

export interface NewsletterCampaign {
  [key: string]: unknown;
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentAt: string;
}

export interface NewsletterCampaignTemplate {
  id: string;
  name: string;
  description: string;
}

export interface NewsletterCampaignPreview {
  html: string;
}

export interface NewsletterPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NewsletterApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

const DEFAULT_CONFIG: Required<NewsletterConfig> = {
  apiUrl: '',
  subscribeEndpoint: '/api/newsletter/subscribe',
  popupDismissKey: 'newsletter_popup_dismissed',
  popupDismissTtlDays: 30,
};

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private config: Required<NewsletterConfig> = { ...DEFAULT_CONFIG };

  /** Configura el dominio de la API propia y otras opciones. Llamar una vez al arrancar la app. */
  configure(config: NewsletterConfig): void {
    this.config = { ...this.config, ...config };
  }

  /** Da de alta un email en la newsletter. `source` identifica el origen (footer, popup, blog...). */
  subscribe(email: string, source?: string): Observable<NewsletterSubscribeResponse> {
    return this.http.post<NewsletterSubscribeResponse>(
      `${this.config.apiUrl}${this.config.subscribeEndpoint}`,
      { email, source },
    );
  }

  /** true si el usuario cerró el popup hace menos de `popupDismissTtlDays` días. */
  isPopupDismissed(): boolean {
    try {
      const dismissedAt = Number(localStorage.getItem(this.config.popupDismissKey));
      if (!dismissedAt) return false;

      const ttlMs = this.config.popupDismissTtlDays * 24 * 60 * 60 * 1000;
      return Date.now() - dismissedAt < ttlMs;
    } catch {
      return false;
    }
  }

  /** Marca el popup como descartado durante `popupDismissTtlDays` días. */
  dismissPopup(): void {
    try {
      localStorage.setItem(this.config.popupDismissKey, String(Date.now()));
    } catch {
      // localStorage no disponible (SSR, modo privado, etc.)
    }
  }

  /* ══════════════════════════════════════════════════════════════
     ADMIN — requiere usuario autenticado con rol ADMIN/EDITOR
     ══════════════════════════════════════════════════════════════ */

  /** Lista paginada de suscriptores. `status`: 'pending' | 'confirmed' | 'unsubscribed'. */
  listSubscribers(status?: NewsletterSubscriberStatus, page = 0, size = 20):
    Observable<NewsletterApiResponse<NewsletterPage<NewsletterSubscriberAdmin>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);

    return this.http.get<NewsletterApiResponse<NewsletterPage<NewsletterSubscriberAdmin>>>(
      `${this.config.apiUrl}/api/admin/newsletter/subscribers`,
      { params },
    );
  }

  /** Descarga el CSV de suscriptores (incluye el token de auth vía interceptor). */
  exportSubscribersCsv(status?: NewsletterSubscriberStatus): Observable<string> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get(`${this.config.apiUrl}/api/admin/newsletter/subscribers/export`, {
      params,
      responseType: 'text',
    });
  }

  /**
   * Envía una campaña por email a todos los suscriptores confirmados.
   * `templateId` es opcional: si se omite, el contenido se envía tal cual ("a pelo").
   */
  sendCampaign(subject: string, body: string, templateId?: string): Observable<NewsletterApiResponse<NewsletterCampaign>> {
    return this.http.post<NewsletterApiResponse<NewsletterCampaign>>(
      `${this.config.apiUrl}/api/admin/newsletter/campaigns`,
      { subject, body, templateId: templateId || null },
    );
  }

  /** Historial paginado de campañas enviadas. */
  listCampaigns(page = 0, size = 20): Observable<NewsletterApiResponse<NewsletterPage<NewsletterCampaign>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<NewsletterApiResponse<NewsletterPage<NewsletterCampaign>>>(
      `${this.config.apiUrl}/api/admin/newsletter/campaigns`,
      { params },
    );
  }

  /** Plantillas de campaña disponibles (genéricas, adaptadas a la marca configurada en el backend). */
  listCampaignTemplates(): Observable<NewsletterApiResponse<NewsletterCampaignTemplate[]>> {
    return this.http.get<NewsletterApiResponse<NewsletterCampaignTemplate[]>>(
      `${this.config.apiUrl}/api/admin/newsletter/campaign-templates`,
    );
  }

  /**
   * Renderiza el HTML del email para esta campaña sin enviarlo, para previsualizarlo.
   * `templateId` es opcional: si se omite, devuelve el contenido tal cual ("a pelo").
   */
  previewCampaign(subject: string, body: string, templateId?: string): Observable<NewsletterApiResponse<NewsletterCampaignPreview>> {
    return this.http.post<NewsletterApiResponse<NewsletterCampaignPreview>>(
      `${this.config.apiUrl}/api/admin/newsletter/campaigns/preview`,
      { subject, body, templateId: templateId || null },
    );
  }
}
