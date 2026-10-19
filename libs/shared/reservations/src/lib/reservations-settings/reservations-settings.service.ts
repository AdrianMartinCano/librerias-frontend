import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationsSettings } from '@org/models';

interface ApiResponse<T> { success: boolean; data?: T; message?: string; }

/**
 * Lee y guarda los ajustes de reservas del backend (requiere sesión ADMIN/EDITOR).
 * Endpoints: GET/PUT /api/admin/reservations/settings.
 */
@Injectable({ providedIn: 'root' })
export class ReservationsSettingsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/admin/reservations/settings';

  get(): Observable<ApiResponse<ReservationsSettings>> {
    return this.http.get<ApiResponse<ReservationsSettings>>(this.endpoint);
  }

  update(settings: ReservationsSettings): Observable<ApiResponse<ReservationsSettings>> {
    return this.http.put<ApiResponse<ReservationsSettings>>(this.endpoint, settings);
  }
}
