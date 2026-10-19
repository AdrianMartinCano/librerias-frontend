import { InjectionToken, Provider } from '@angular/core';

/** Configuración global de la librería de eventos, inyectable en toda la app. */
export interface EventsGlobalConfig {
  /** Endpoint por defecto al que el RSVP hace POST (módulo Spring `events`). */
  rsvpEndpoint: string;
  /** Locale para formatear fechas. Default 'es-ES'. */
  locale: string;
}

export const EVENTS_CONFIG = new InjectionToken<EventsGlobalConfig>('EVENTS_CONFIG');

const DEFAULTS: EventsGlobalConfig = {
  rsvpEndpoint: '/api/events/rsvp',
  locale: 'es-ES',
};

/**
 * Registra la configuración global de eventos en el bootstrap de la app:
 *
 *   providers: [ provideEvents({ rsvpEndpoint: '/api/events/rsvp' }) ]
 */
export function provideEvents(config: Partial<EventsGlobalConfig> = {}): Provider {
  return { provide: EVENTS_CONFIG, useValue: { ...DEFAULTS, ...config } };
}
