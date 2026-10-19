import { EventHost, EventType, EventVenue } from '@org/models';

/**
 * Contexto derivado de `EventConfig` que `EventPageComponent` inyecta en cada
 * bloque, para que puedan rellenar huecos (título, fecha, lugar) sin repetir
 * datos en cada sección.
 */
export interface EventContext {
  type: EventType;
  title: string;
  subtitle?: string;
  date: string;
  venue?: EventVenue;
  hosts?: EventHost[];
  locale: string;
  emoji: string;
  rsvpEndpoint: string;
  /** Id del evento (slug) para agrupar respuestas de RSVP. */
  eventId: string;
}
