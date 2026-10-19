import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LocationData, EventVenue } from '@org/models';
import { EventContext } from '../../event-context';

@Component({
  selector: 'lib-event-location',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (venue(); as v) {
      <section class="section ev-location">
        <div class="container">
          <h2 class="ev-location__title text-center">{{ title() }}</h2>
          <div class="ev-location__card">
            @if (mapSrc()) {
              <iframe class="ev-location__map" [src]="mapSrc()" loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade" title="Mapa del evento"></iframe>
            }
            <div class="ev-location__info">
              <p class="ev-location__venue">{{ v.name }}</p>
              @if (v.address) { <p class="ev-location__address">{{ v.address }}</p> }
              @if (data().directions) { <p class="ev-location__note">🚗 {{ data().directions }}</p> }
              @if (data().parking) { <p class="ev-location__note">🅿️ {{ data().parking }}</p> }
              @if (mapLink()) {
                <a class="ev-location__btn" [href]="mapLink()" target="_blank" rel="noopener">Cómo llegar</a>
              }
            </div>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .ev-location__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-location__card { display: grid; gap: var(--space-6); grid-template-columns: 1fr;
      background: var(--color-background); border: 1px solid var(--color-border);
      border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-md); }
    @media (min-width: 768px) { .ev-location__card { grid-template-columns: 1.4fr 1fr; } }
    .ev-location__map { width: 100%; min-height: 320px; border: 0; }
    .ev-location__info { padding: var(--space-8); }
    .ev-location__venue { font-family: var(--heading-font, inherit); font-size: var(--font-size-2xl);
      color: var(--color-text); }
    .ev-location__address { color: var(--color-text-secondary); margin-top: var(--space-2); }
    .ev-location__note { margin-top: var(--space-4); color: var(--color-text-secondary); }
    .ev-location__btn { display: inline-block; margin-top: var(--space-6); padding: var(--space-3) var(--space-6);
      background: var(--p2); color: #fff; border-radius: var(--radius-full); font-weight: 600; }
    .ev-location__btn:hover { text-decoration: none; filter: brightness(.95); }
  `],
})
export class LocationComponent {
  readonly data = input<LocationData>({});
  readonly ctx = input.required<EventContext>();
  private readonly sanitizer = inject(DomSanitizer);

  readonly title = computed(() => this.data().title ?? 'Cómo llegar');
  readonly venue = computed<EventVenue | undefined>(() => this.data().venue ?? this.ctx().venue);

  readonly mapSrc = computed<SafeResourceUrl | null>(() => {
    const v = this.venue();
    if (!v) return null;
    const q = v.lat != null && v.lng != null ? `${v.lat},${v.lng}` : (v.address ?? v.name);
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly mapLink = computed(() => {
    const v = this.venue();
    if (!v) return null;
    if (v.mapUrl) return v.mapUrl;
    const q = v.lat != null && v.lng != null ? `${v.lat},${v.lng}` : (v.address ?? v.name);
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}`;
  });
}
