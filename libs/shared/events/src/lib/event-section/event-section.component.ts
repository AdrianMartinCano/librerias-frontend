import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { GalleryComponent, FaqComponent } from '@org/cms';
import {
  EventSection, EventHeroData, CountdownData, EventDetailsData, TimelineData, DressCodeData,
  MenuData, LocationData, AccommodationData, GiftRegistryData, OurStoryData, RsvpData,
  GalleryData, FaqData,
} from '@org/models';
import { EventContext } from '../event-context';
import { EventHeroComponent } from '../blocks/event-hero/event-hero.component';
import { CountdownComponent } from '../blocks/countdown/countdown.component';
import { EventDetailsComponent } from '../blocks/event-details/event-details.component';
import { TimelineComponent } from '../blocks/timeline/timeline.component';
import { DressCodeComponent } from '../blocks/dress-code/dress-code.component';
import { MenuComponent } from '../blocks/menu/menu.component';
import { LocationComponent } from '../blocks/location/location.component';
import { AccommodationComponent } from '../blocks/accommodation/accommodation.component';
import { GiftRegistryComponent } from '../blocks/gift-registry/gift-registry.component';
import { OurStoryComponent } from '../blocks/our-story/our-story.component';
import { RsvpComponent } from '../blocks/rsvp/rsvp.component';

/** Renderiza una sección de evento según su `type`. Delega gallery/faq al CMS. */
@Component({
  selector: 'lib-event-section',
  standalone: true,
  imports: [
    EventHeroComponent, CountdownComponent, EventDetailsComponent, TimelineComponent, DressCodeComponent,
    MenuComponent, LocationComponent, AccommodationComponent, GiftRegistryComponent, OurStoryComponent,
    RsvpComponent, GalleryComponent, FaqComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @switch (section().type) {
      @case ('event-hero')     { <lib-event-hero          [data]="d()" [ctx]="ctx()" /> }
      @case ('countdown')      { <lib-event-countdown     [data]="d()" [ctx]="ctx()" /> }
      @case ('event-details')  { <lib-event-details       [data]="d()" [ctx]="ctx()" /> }
      @case ('timeline')       { <lib-event-timeline      [data]="d()" /> }
      @case ('dress-code')     { <lib-event-dress-code    [data]="d()" /> }
      @case ('menu')           { <lib-event-menu          [data]="d()" /> }
      @case ('location')       { <lib-event-location      [data]="d()" [ctx]="ctx()" /> }
      @case ('accommodation')  { <lib-event-accommodation [data]="d()" /> }
      @case ('gift-registry')  { <lib-event-gift-registry [data]="d()" /> }
      @case ('our-story')      { <lib-event-our-story     [data]="d()" /> }
      @case ('rsvp')           { <lib-event-rsvp          [data]="d()" [ctx]="ctx()" /> }
      @case ('gallery')        { <lib-cms-gallery         [data]="gallery()" /> }
      @case ('faq')            { <lib-cms-faq             [data]="faq()" /> }
    }
  `,
})
export class EventSectionComponent {
  readonly section = input.required<EventSection>();
  readonly ctx = input.required<EventContext>();

  /** Datos de la sección tipados de forma laxa para el `@switch`. */
  readonly d = computed(() => (this.section().data ?? {}) as EventHeroData & CountdownData & EventDetailsData &
    TimelineData & DressCodeData & MenuData & LocationData & AccommodationData & GiftRegistryData & OurStoryData & RsvpData);
  readonly gallery = computed(() => (this.section().data ?? { images: [] }) as GalleryData);
  readonly faq = computed(() => (this.section().data ?? { items: [] }) as FaqData);
}
