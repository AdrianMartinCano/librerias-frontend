# @org/events (`@adrianmartincano/ng-events`)

Librería de **composición** para montar la web de un evento (boda, cumpleaños,
bautizo, comunión, aniversario, baby shower, graduación, quinceañera, corporativo,
gala, fiesta…) a partir de **una sola config**. Reutiliza `@org/cms`, `@org/theme`
y `@org/models`.

Tres ideas:

1. **Data-driven.** Un evento = un `EventConfig` (JSON). Los tipos viven en un
   catálogo (`EVENT_TYPES`); añadir uno nuevo es una entrada, no código.
2. **Los estilos definen la web.** Cada evento usa un preset de tema (`EVENT_THEMES`):
   paleta `--p1..--p4` + tipografía, aplicada **en runtime** como CSS custom
   properties. Cambias el preset → cambia toda la web. Sin build.
3. **Reveal progresivo.** Cada sección lleva `revealFrom` / `revealUntil`; la
   página solo muestra lo que ya "toca" según la fecha (el *save the date* va
   creciendo hasta el evento).

## Instalación / providers

```ts
// app.config.ts
import { provideHttpClient } from '@angular/common/http';
import { provideEvents } from '@org/events';

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideEvents({ rsvpEndpoint: '/api/events/rsvp', locale: 'es-ES' }),
  ],
};
```

Importa el design system en tu `styles.css`: `@import '@adrianmartincano/ng-theme';`

## Uso mínimo

```ts
import { EventPageComponent } from '@org/events';
import { EventConfig } from '@org/models';

@Component({
  imports: [EventPageComponent],
  template: `<lib-event-page [config]="boda" />`,
})
export class BodaPage {
  boda: EventConfig = {
    type: 'wedding',
    id: 'maria-y-juan',
    title: 'María & Juan',
    date: '2026-09-12T18:00:00',
    theme: 'wedding-romantic',          // o un tema a medida { p1, p2, p3, p4, ... }
    venue: { name: 'Finca Los Olivos', address: 'Toledo', lat: 39.86, lng: -4.02 },
    sections: [
      { type: 'event-hero', data: { tagline: '¡Nos casamos!' } },
      { type: 'countdown' },
      { type: 'event-details', revealFrom: '2026-06-01' },   // se revela 3 meses antes
      { type: 'dress-code', revealFrom: '2026-08-01', data: { code: 'Etiqueta' } },
      { type: 'menu', revealFrom: '2026-08-20', data: { courses: [/* … */], options: ['Carne', 'Pescado', 'Vegano'] } },
      { type: 'location' },
      { type: 'rsvp', data: { fields: { plusOnes: true, menu: true, allergies: true, song: true } } },
    ],
  };
}
```

Si omites `sections`, se usan las **por defecto del tipo** (`EVENT_TYPES[type].defaultSections`).
Si omites `theme`, se usa el preset por defecto del tipo.

## Secciones disponibles

`event-hero` · `countdown` · `event-details` · `timeline` · `dress-code` · `menu` ·
`location` · `accommodation` · `gift-registry` · `our-story` · `rsvp` ·
`gallery` (delegada a `@org/cms`) · `faq` (delegada a `@org/cms`).

## RSVP

El bloque `rsvp` hace `POST` de un `RsvpRequest` al endpoint configurado
(`rsvpEndpoint` global o `data.endpoint` de la sección). El backend es el
módulo Spring **`events`** de `librerias-backend` (entidad RSVP + endpoints
`/api/events/rsvp` y `/api/events/rsvp/summary`).

## Temas

Presets en `EVENT_THEMES` (usa `EVENT_THEME_LIST` para poblar un selector).
Un tema a medida es un objeto `EventTheme`:

```ts
theme: { p1: '#1f2a44', p2: '#b7973f', p3: '#dcdfe6', p4: '#f7f8fa',
         headingFont: "'Playfair Display', serif", fontUrl: 'https://fonts.googleapis.com/...' }
```
