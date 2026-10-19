import {
  Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, inject, effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EventConfig, EventSection, EventThemePreset } from '@org/models';
import { EVENTS_CONFIG } from '../events.token';
import { EventContext } from '../event-context';
import { EventSectionComponent } from '../event-section/event-section.component';
import { resolveEventTypeDef } from '../event-types.catalog';
import { resolveEventTheme, EVENT_THEMES } from '../event-themes.catalog';
import { isRevealed } from '../reveal.util';

/**
 * Renderiza la web completa de un evento a partir de un `EventConfig`.
 * - Aplica el tema (paleta + tipografía) como CSS custom properties en runtime.
 * - Muestra solo las secciones "reveladas" según la fecha (reveal progresivo).
 */
@Component({
  selector: 'lib-event-page',
  standalone: true,
  imports: [EventSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[style]': 'themeStyle()', class: 'lib-event-page' },
  template: `
    @for (section of visibleSections(); track section.id ?? $index) {
      <lib-event-section [section]="section" [ctx]="ctx()" />
    }
  `,
  styles: [`.lib-event-page { display: block; background: var(--color-background); color: var(--color-text); }`],
})
export class EventPageComponent {
  readonly config = input.required<EventConfig>();
  /** Fecha "ahora" inyectable (para previsualizar el reveal en otra fecha). */
  readonly now = input<Date>();

  private readonly global = inject(EVENTS_CONFIG, { optional: true });
  private readonly doc = inject(DOCUMENT);

  private readonly typeDef = computed(() => resolveEventTypeDef(this.config().type));

  readonly theme = computed<EventThemePreset>(() => {
    const t = this.config().theme;
    if (t && typeof t === 'object') {
      // Tema a medida: se completa con los campos del preset por defecto del tipo.
      const base = resolveEventTheme(this.typeDef().defaultTheme);
      return { ...base, ...t, id: 'custom', label: 'Personalizado' };
    }
    return resolveEventTheme((t as string) ?? this.typeDef().defaultTheme);
  });

  /** Secciones a partir de la config, o las por defecto del tipo si no se dan. */
  readonly sections = computed<EventSection[]>(() => {
    const given = this.config().sections;
    if (given?.length) return given;
    return this.typeDef().defaultSections.map<EventSection>((type) => ({ type }));
  });

  readonly visibleSections = computed(() => {
    const at = this.now() ?? new Date();
    return this.sections().filter((s) => isRevealed(s, at));
  });

  readonly ctx = computed<EventContext>(() => {
    const c = this.config();
    return {
      type: c.type,
      title: c.title,
      subtitle: c.subtitle,
      date: c.date,
      venue: c.venue,
      hosts: c.hosts,
      locale: c.locale ?? this.global?.locale ?? 'es-ES',
      emoji: this.typeDef().emoji,
      rsvpEndpoint: this.global?.rsvpEndpoint ?? '/api/events/rsvp',
      eventId: c.id ?? slugify(c.title),
    };
  });

  /** CSS custom properties del tema, aplicadas al host: definen toda la web. */
  readonly themeStyle = computed<string>(() => {
    const t = this.theme();
    const parts = [
      `--p1:${t.p1}`, `--p2:${t.p2}`, `--p3:${t.p3}`, `--p4:${t.p4}`,
      // Reafirmamos los tokens semánticos para que se re-deriven con esta paleta
      // (si no, heredarían el valor calculado en :root).
      `--color-primary:${t.p1}`, `--color-accent:${t.p2}`, `--color-border:${t.p3}`, `--color-surface:${t.p4}`,
      `--color-accent-hover:color-mix(in srgb, ${t.p2} 82%, black)`,
      `--color-primary-light:color-mix(in srgb, ${t.p1} 72%, white)`,
      `--color-footer-bg:${t.p1}`,
    ];
    if (t.headingFont) parts.push(`--heading-font:${t.headingFont}`);
    if (t.font) parts.push(`font-family:${t.font}`);
    return parts.join(';');
  });

  constructor() {
    // Inyecta el <link> de fuentes del preset una sola vez (solo navegador).
    effect(() => {
      const url = this.theme().fontUrl;
      if (!url || typeof this.doc === 'undefined') return;
      const id = 'ev-font-' + hash(url);
      if (this.doc.getElementById(id)) return;
      const link = this.doc.createElement('link');
      link.id = id; link.rel = 'stylesheet'; link.href = url;
      this.doc.head.appendChild(link);
    });
  }
}

/** Presets disponibles (útil para selectores en un editor). */
export const EVENT_THEME_LIST = Object.values(EVENT_THEMES);

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(36);
}
