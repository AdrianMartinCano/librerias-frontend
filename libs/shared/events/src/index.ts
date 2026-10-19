// Página y composición
export * from './lib/event-page/event-page.component';
export * from './lib/event-section/event-section.component';
export * from './lib/event-context';

// Configuración / DI
export * from './lib/events.token';

// Catálogos (tipos de evento + temas)
export * from './lib/event-types.catalog';
export * from './lib/event-themes.catalog';

// Utilidades de reveal / cuenta atrás / formato
export * from './lib/reveal.util';
export * from './lib/event-format.util';

// Bloques de evento (para uso suelto o registro en el CMS)
export * from './lib/blocks/event-hero/event-hero.component';
export * from './lib/blocks/countdown/countdown.component';
export * from './lib/blocks/event-details/event-details.component';
export * from './lib/blocks/timeline/timeline.component';
export * from './lib/blocks/dress-code/dress-code.component';
export * from './lib/blocks/menu/menu.component';
export * from './lib/blocks/location/location.component';
export * from './lib/blocks/accommodation/accommodation.component';
export * from './lib/blocks/gift-registry/gift-registry.component';
export * from './lib/blocks/our-story/our-story.component';
export * from './lib/blocks/rsvp/rsvp.component';
export * from './lib/blocks/rsvp/rsvp.service';
