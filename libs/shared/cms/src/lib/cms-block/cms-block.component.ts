import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, inject, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CmsBlock } from '@org/models';
import { HeroComponent }         from '../blocks/hero/hero.component';
import { TextImageComponent }    from '../blocks/text-image/text-image.component';
import { FeaturesComponent }     from '../blocks/features/features.component';
import { GalleryComponent }      from '../blocks/gallery/gallery.component';
import { CtaBannerComponent }    from '../blocks/cta-banner/cta-banner.component';
import { FaqComponent }          from '../blocks/faq/faq.component';
import { TestimonialsComponent } from '../blocks/testimonials/testimonials.component';
import { PricingComponent }      from '../blocks/pricing/pricing.component';
import { TextComponent }         from '../blocks/text/text.component';
import { CountersComponent }     from '../blocks/counters/counters.component';
import { TrustBadgesComponent }  from '../blocks/trust-badges/trust-badges.component';
import { NewsletterComponent }   from '../blocks/newsletter/newsletter.component';
import { CMS_CUSTOM_BLOCKS } from './cms-blocks.token';

@Component({
  selector: 'lib-cms-block',
  standalone: true,
  imports: [
    NgComponentOutlet,
    HeroComponent, TextImageComponent, FeaturesComponent, GalleryComponent,
    CtaBannerComponent, FaqComponent, TestimonialsComponent, PricingComponent, TextComponent,
    CountersComponent, TrustBadgesComponent, NewsletterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @switch (block().type) {
      @case ('hero')          { <lib-cms-hero          [data]="blockData()" /> }
      @case ('text-image')    { <lib-cms-text-image    [data]="blockData()" /> }
      @case ('features')      { <lib-cms-features      [data]="blockData()" /> }
      @case ('gallery')       { <lib-cms-gallery       [data]="blockData()" /> }
      @case ('cta-banner')    { <lib-cms-cta-banner    [data]="blockData()" /> }
      @case ('faq')           { <lib-cms-faq           [data]="blockData()" /> }
      @case ('testimonials')  { <lib-cms-testimonials  [data]="blockData()" /> }
      @case ('pricing')       { <lib-cms-pricing       [data]="blockData()" /> }
      @case ('text')          { <lib-cms-text          [data]="blockData()" /> }
      @case ('counters')      { <lib-cms-counters      [data]="blockData()" /> }
      @case ('trust-badges')  { <lib-cms-trust-badges  [data]="blockData()" /> }
      @case ('newsletter')    { <lib-cms-newsletter    [data]="blockData()" /> }
      @default {
        @if (customBlock(); as cmp) {
          <ng-container *ngComponentOutlet="cmp; inputs: blockInputs()" />
        }
        <!-- tipo sin componente registrado: {{ block().type }} -->
      }
    }
  `,
})
export class CmsBlockComponent {
  readonly block     = input.required<CmsBlock>();
  readonly blockData = computed(() => this.block().data as never);

  // Bloques personalizados registrados por el consumidor (p. ej. 'calendar' → ng-reservations).
  private readonly customBlocks = inject(CMS_CUSTOM_BLOCKS, { optional: true });

  readonly customBlock = computed<Type<unknown> | null>(
    () => this.customBlocks?.[this.block().type] ?? null,
  );
  readonly blockInputs = computed(() => ({ data: this.block().data }));
}
