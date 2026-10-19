import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, RsvpRequest, RsvpResponse, RsvpSummary } from '@org/models';

/** Cliente HTTP del RSVP. Habla con el módulo Spring `events` (respuestas envueltas en ApiResponse). */
@Injectable({ providedIn: 'root' })
export class RsvpService {
  private readonly http = inject(HttpClient);

  submit(endpoint: string, payload: RsvpRequest): Observable<RsvpResponse> {
    return this.http.post<ApiResponse<RsvpResponse>>(endpoint, payload).pipe(map((r) => r.data));
  }

  /** Resumen agregado para el organizador (confirmados, acompañantes, por menú). */
  summary(endpoint: string, eventId: string): Observable<RsvpSummary> {
    return this.http.get<ApiResponse<RsvpSummary>>(`${endpoint}/summary`, { params: { eventId } })
      .pipe(map((r) => r.data));
  }
}
