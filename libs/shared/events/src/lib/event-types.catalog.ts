import { EventSectionType, EventType } from '@org/models';

export interface EventTypeDef {
  type: EventType;
  label: string;
  /** Preset de tema por defecto (clave de EVENT_THEMES). */
  defaultTheme: string;
  /** Secciones por defecto y su orden. El consumidor puede sobreescribirlas. */
  defaultSections: EventSectionType[];
  /** Emoji representativo (fallback para portada/countdown). */
  emoji: string;
}

/**
 * Catálogo de tipos de evento. Data-driven: dar de alta un tipo nuevo es
 * añadir una entrada aquí; no hace falta tocar componentes.
 */
export const EVENT_TYPES: Record<EventType, EventTypeDef> = {
  wedding: {
    type: 'wedding', label: 'Boda', emoji: '💍', defaultTheme: 'wedding-classic',
    defaultSections: ['event-hero', 'countdown', 'our-story', 'event-details', 'timeline', 'dress-code', 'menu', 'location', 'accommodation', 'gift-registry', 'gallery', 'faq', 'rsvp'],
  },
  anniversary: {
    type: 'anniversary', label: 'Aniversario', emoji: '❤️', defaultTheme: 'anniversary-gold',
    defaultSections: ['event-hero', 'countdown', 'our-story', 'event-details', 'timeline', 'menu', 'location', 'gallery', 'rsvp'],
  },
  birthday: {
    type: 'birthday', label: 'Cumpleaños', emoji: '🎂', defaultTheme: 'birthday-elegant',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'dress-code', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  'kids-birthday': {
    type: 'kids-birthday', label: 'Cumpleaños infantil', emoji: '🎈', defaultTheme: 'kids-birthday',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  baptism: {
    type: 'baptism', label: 'Bautizo', emoji: '👶', defaultTheme: 'baptism-pastel',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'menu', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  communion: {
    type: 'communion', label: 'Comunión', emoji: '🕊️', defaultTheme: 'communion',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'menu', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  'baby-shower': {
    type: 'baby-shower', label: 'Baby shower', emoji: '🍼', defaultTheme: 'baby-shower',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  graduation: {
    type: 'graduation', label: 'Graduación', emoji: '🎓', defaultTheme: 'graduation',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'location', 'gallery', 'rsvp'],
  },
  quinceanera: {
    type: 'quinceanera', label: 'Quinceañera', emoji: '👑', defaultTheme: 'quinceanera',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'dress-code', 'menu', 'location', 'gift-registry', 'gallery', 'rsvp'],
  },
  corporate: {
    type: 'corporate', label: 'Evento corporativo', emoji: '🏢', defaultTheme: 'corporate',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'location', 'accommodation', 'faq', 'rsvp'],
  },
  gala: {
    type: 'gala', label: 'Gala', emoji: '🥂', defaultTheme: 'gala',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'timeline', 'dress-code', 'menu', 'location', 'gallery', 'rsvp'],
  },
  party: {
    type: 'party', label: 'Fiesta', emoji: '🎉', defaultTheme: 'party',
    defaultSections: ['event-hero', 'countdown', 'event-details', 'dress-code', 'location', 'gallery', 'rsvp'],
  },
};

export function resolveEventTypeDef(type: EventType): EventTypeDef {
  return EVENT_TYPES[type] ?? EVENT_TYPES.party;
}
