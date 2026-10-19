import { GalleryData, FaqData } from './cms.models';

/**
 * Tipos de evento soportados. Cada uno tiene una entrada en el catálogo
 * `EVENT_TYPES` (secciones por defecto + preset de tema). Añadir un tipo
 * nuevo = añadir una entrada al catálogo, no escribir componentes nuevos.
 */
export type EventType =
  | 'wedding'          // boda
  | 'anniversary'      // aniversario de boda
  | 'birthday'         // cumpleaños (adulto)
  | 'kids-birthday'    // cumpleaños infantil
  | 'baptism'          // bautizo
  | 'communion'        // comunión
  | 'baby-shower'      // baby shower
  | 'graduation'       // graduación
  | 'quinceanera'      // quinceañera / 15 años
  | 'corporate'        // evento de empresa / inauguración
  | 'gala'             // gala / cena benéfica
  | 'party';           // fiesta genérica (comodín)

/**
 * Secciones que puede tener la web de un evento. `gallery` y `faq` se
 * delegan al CMS (`@org/cms`); el resto son bloques propios de eventos.
 */
export type EventSectionType =
  | 'event-hero'       // portada: nombres/título + fecha + frase
  | 'countdown'        // cuenta atrás a la fecha
  | 'event-details'    // cuándo y dónde (fecha, hora, lugar)
  | 'timeline'         // agenda / programa del día
  | 'dress-code'       // código de vestimenta
  | 'menu'             // menú del evento
  | 'location'         // mapa / cómo llegar
  | 'accommodation'    // alojamiento sugerido
  | 'gift-registry'    // lista de regalos / Bizum / cuenta
  | 'our-story'        // historia (bodas) / sobre el homenajeado
  | 'rsvp'             // confirmación de asistencia
  | 'gallery'          // galería de fotos (delegado a CMS)
  | 'faq';             // preguntas frecuentes (delegado a CMS)

/* ─────────────────────────────────────────────
   TEMA — "los estilos definen la web"
   Paleta de 4 colores + tipografía, aplicada en
   runtime como CSS custom properties. Encaja con
   el design system de @org/theme (Opción A: --p1..--p4).
   ───────────────────────────────────────────── */
export interface EventTheme {
  /** Color oscuro/marca: portada, botones primary, footer. → --p1 */
  p1: string;
  /** Color de acento: CTAs, links, cuenta atrás, badges. → --p2 */
  p2: string;
  /** Neutro: bordes y separadores. → --p3 */
  p3: string;
  /** Claro: fondos de sección y superficies. → --p4 */
  p4: string;
  /** Tipografía del cuerpo (font-family completa o nombre de fuente cargada). */
  font?: string;
  /** Tipografía de títulos (h1..h6). Da carácter al evento. */
  headingFont?: string;
  /**
   * URL de <link> de fuentes a inyectar (p. ej. Google Fonts).
   * Ej: 'https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap'
   */
  fontUrl?: string;
  /** Estética de la portada. */
  heroStyle?: 'photo' | 'minimal' | 'festive' | 'elegant';
}

/** Preset de tema con nombre, para el catálogo `EVENT_THEMES`. */
export interface EventThemePreset extends EventTheme {
  id: string;
  label: string;
}

/* ─────────────────────────────────────────────
   CONFIG DEL EVENTO
   ───────────────────────────────────────────── */
export interface EventHost {
  name: string;
  role?: string;   // 'Novia', 'Padre', 'Homenajeada'…
  avatar?: string;
}

export interface EventVenue {
  name: string;
  address?: string;
  /** Coordenadas para el mapa. */
  lat?: number;
  lng?: number;
  /** URL de Google Maps / cómo llegar (si no hay coordenadas). */
  mapUrl?: string;
}

export interface EventSection<T = unknown> {
  type: EventSectionType;
  id?: string;
  /** Título visible de la sección (si aplica). */
  title?: string;
  /** El bloque solo se muestra a partir de esta fecha ISO (reveal progresivo). */
  revealFrom?: string;
  /** El bloque deja de mostrarse a partir de esta fecha ISO. */
  revealUntil?: string;
  /** Datos específicos de la sección. */
  data?: T;
}

export interface EventConfig {
  type: EventType;
  /** Identificador estable del evento (slug) para agrupar los RSVP. Si se omite, se deriva del título. */
  id?: string;
  /** Título principal: "María & Juan", "Cumple de Leo", "50 Aniversario". */
  title: string;
  subtitle?: string;
  /** Fecha/hora del evento en ISO (ej. '2026-09-12T18:00:00'). */
  date: string;
  timezone?: string;
  hosts?: EventHost[];
  venue?: EventVenue;
  /** Preset por id (string del catálogo) o tema a medida. Si se omite, se usa el del tipo. */
  theme?: EventTheme | string;
  /** Secciones a renderizar, en orden. Si se omite, se usan las del tipo. */
  sections?: EventSection[];
  locale?: string;   // 'es-ES' por defecto
}

/* ─────────────────────────────────────────────
   DATOS DE CADA SECCIÓN
   ───────────────────────────────────────────── */
export interface EventHeroData {
  /** Si se omite, usa EventConfig.title. */
  title?: string;
  subtitle?: string;
  /** Frase corta ("¡Nos casamos!", "¡Cumplo 40!"). */
  tagline?: string;
  image?: string;
  imageAlt?: string;
  /** Muestra la fecha formateada bajo el título. Default true. */
  showDate?: boolean;
}

export interface CountdownData {
  title?: string;
  /** Fecha objetivo ISO. Si se omite, usa EventConfig.date. */
  target?: string;
  /** Texto al llegar a 0. */
  finishedText?: string;
}

export interface EventDetailsItem {
  icon?: string;    // emoji
  label: string;    // 'Ceremonia', 'Banquete'…
  value: string;    // '18:00 · Iglesia de San Juan'
  time?: string;    // ISO opcional para orden
}

export interface EventDetailsData {
  title?: string;
  items: EventDetailsItem[];
}

export interface TimelineStep {
  time: string;     // '18:00'
  title: string;    // 'Ceremonia'
  description?: string;
  icon?: string;
}

export interface TimelineData {
  title?: string;
  steps: TimelineStep[];
}

export interface DressCodeData {
  title?: string;
  /** Nombre del código: 'Etiqueta', 'Cóctel', 'Temático 80s'. */
  code: string;
  description?: string;
  /** Colores sugeridos/prohibidos como muestras. */
  palette?: { color: string; label?: string }[];
  avoid?: string;   // 'Evita el blanco'
}

export interface MenuDish {
  name: string;
  description?: string;
  /** Alérgenos/etiquetas: 'vegano', 'sin gluten'… */
  tags?: string[];
}

export interface MenuCourse {
  name: string;     // 'Entrantes', 'Principal', 'Postre'
  dishes: MenuDish[];
}

export interface MenuData {
  title?: string;
  courses: MenuCourse[];
  /** Opciones de menú elegibles en el RSVP (p. ej. Carne / Pescado / Vegano). */
  options?: string[];
  note?: string;    // 'Indícanos alergias en la confirmación'
}

export interface LocationData {
  title?: string;
  /** Si se omite, usa EventConfig.venue. */
  venue?: EventVenue;
  directions?: string;
  parking?: string;
}

export interface AccommodationItem {
  name: string;
  description?: string;
  url?: string;
  phone?: string;
  distance?: string;   // 'a 5 min del lugar'
}

export interface AccommodationData {
  title?: string;
  items: AccommodationItem[];
}

export interface GiftOption {
  icon?: string;
  label: string;      // 'Bizum', 'Nº de cuenta', 'Lista en El Corte Inglés'
  value: string;      // el número / IBAN / URL
  /** Si value es una URL, se renderiza como enlace. */
  isLink?: boolean;
}

export interface GiftRegistryData {
  title?: string;
  message?: string;
  options: GiftOption[];
}

export interface OurStoryData {
  title?: string;
  text?: string;
  image?: string;
  /** Hitos ("2018 · Nos conocimos"). */
  milestones?: { date: string; title: string; description?: string; image?: string }[];
}

/** Reutilizamos los modelos del CMS para las secciones delegadas. */
export type EventGalleryData = GalleryData;
export type EventFaqData = FaqData;

/* ─────────────────────────────────────────────
   RSVP — confirmación de asistencia
   Contrato compartido front (POST) ↔ backend Spring (módulo events).
   ───────────────────────────────────────────── */
export interface RsvpFieldConfig {
  /** Pedir nº de acompañantes. */
  plusOnes?: boolean;
  maxPlusOnes?: number;
  /** Pedir elección de menú (usa MenuData.options). */
  menu?: boolean;
  /** Pedir alergias / restricciones. */
  allergies?: boolean;
  /** Pedir canción para la fiesta. */
  song?: boolean;
  /** Campo libre de mensaje. */
  message?: boolean;
}

export interface RsvpData {
  title?: string;
  subtitle?: string;
  /** Endpoint al que se hace POST. Si se omite, usa EVENTS_CONFIG.rsvpEndpoint. */
  endpoint?: string;
  /** Fecha límite de confirmación (ISO). */
  deadline?: string;
  fields?: RsvpFieldConfig;
  /** Opciones de menú (si no vienen de la sección menu). */
  menuOptions?: string[];
  successMessage?: string;
}

/** Payload que el formulario RSVP envía al backend. */
export interface RsvpRequest {
  /** Identificador del evento (slug/id) para agrupar las respuestas. */
  eventId: string;
  name: string;
  email?: string;
  attending: boolean;
  guests?: number;          // acompañantes (0 = solo yo)
  menuChoice?: string;
  allergies?: string;
  song?: string;
  message?: string;
}

export interface RsvpResponse {
  id: string | number;
  eventId: string;
  name: string;
  attending: boolean;
  guests: number;
  createdAt: string;
}

/** Resumen agregado para el organizador. */
export interface RsvpSummary {
  eventId: string;
  confirmed: number;      // nº de respuestas "asistiré"
  declined: number;
  totalGuests: number;    // confirmados + acompañantes
  byMenu?: Record<string, number>;
}
