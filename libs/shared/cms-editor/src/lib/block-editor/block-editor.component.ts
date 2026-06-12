import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, computed } from '@angular/core';
import { CmsBlock } from '@org/models';
import { HeroFormComponent }         from '../block-forms/hero-form/hero-form.component';
import { TextFormComponent }         from '../block-forms/text-form/text-form.component';
import { TextImageFormComponent }    from '../block-forms/text-image-form/text-image-form.component';
import { FeaturesFormComponent }     from '../block-forms/features-form/features-form.component';
import { GalleryFormComponent }      from '../block-forms/gallery-form/gallery-form.component';
import { CtaBannerFormComponent }    from '../block-forms/cta-banner-form/cta-banner-form.component';
import { FaqFormComponent }          from '../block-forms/faq-form/faq-form.component';
import { TestimonialsFormComponent } from '../block-forms/testimonials-form/testimonials-form.component';
import { PricingFormComponent }      from '../block-forms/pricing-form/pricing-form.component';
import { CountersFormComponent }     from '../block-forms/counters-form/counters-form.component';
import { TrustBadgesFormComponent }  from '../block-forms/trust-badges-form/trust-badges-form.component';
import { NewsletterBlockFormComponent } from '../block-forms/newsletter-form/newsletter-form.component';

const BLOCK_LABELS: Record<string, string> = {
  'hero':         'Hero',
  'text':         'Texto',
  'text-image':   'Texto + Imagen',
  'features':     'Features',
  'gallery':      'Galería',
  'cta-banner':   'CTA Banner',
  'faq':          'FAQ',
  'testimonials': 'Testimonios',
  'pricing':      'Precios',
  'counters':     'Contadores',
  'trust-badges': 'Trust Badges',
  'newsletter':   'Newsletter',
};

@Component({
  selector: 'lib-cms-block-editor',
  standalone: true,
  imports: [
    HeroFormComponent, TextFormComponent, TextImageFormComponent,
    FeaturesFormComponent, GalleryFormComponent, CtaBannerFormComponent,
    FaqFormComponent, TestimonialsFormComponent, PricingFormComponent,
    CountersFormComponent, TrustBadgesFormComponent, NewsletterBlockFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cbe" [class.cbe--active]="active()">
      <div class="cbe__header">
        <button type="button" class="cbe__toggle" (click)="toggleExpanded()">
          <span class="cbe__label">{{ label() }}</span>
          <span class="cbe__chevron">{{ expanded ? '▲' : '▼' }}</span>
        </button>
        <div class="cbe__actions">
          <button type="button" class="cbe__btn" title="Subir" [disabled]="isFirst()" (click)="move.emit('up')">↑</button>
          <button type="button" class="cbe__btn" title="Bajar" [disabled]="isLast()" (click)="move.emit('down')">↓</button>
          <button type="button" class="cbe__btn cbe__btn--danger" title="Eliminar" (click)="remove.emit()">✕</button>
        </div>
      </div>
      @if (expanded) {
        <div class="cbe__form">
          @switch (block().type) {
            @case ('hero')         { <lib-cms-hero-form         [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('text')         { <lib-cms-text-form         [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('text-image')   { <lib-cms-text-image-form   [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('features')     { <lib-cms-features-form     [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('gallery')      { <lib-cms-gallery-form      [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('cta-banner')   { <lib-cms-cta-banner-form   [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('faq')          { <lib-cms-faq-form          [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('testimonials') { <lib-cms-testimonials-form [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('pricing')      { <lib-cms-pricing-form      [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('counters')     { <lib-cms-counters-form     [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('trust-badges') { <lib-cms-trust-badges-form [initialData]="blockData()" (changed)="onChanged($event)" /> }
            @case ('newsletter')   { <lib-cms-newsletter-form   [initialData]="blockData()" (changed)="onChanged($event)" /> }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .cbe { border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; margin-bottom: 8px; overflow: hidden; background: var(--color-background, #fff); }
    .cbe--active { border-color: var(--color-accent, #ff4d4d); }

    .cbe__header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-surface, #f8f9fa); }
    .cbe--active .cbe__header { background: color-mix(in srgb, var(--color-accent, #ff4d4d) 8%, var(--color-surface, #f8f9fa)); }

    .cbe__toggle { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 600; flex: 1; text-align: left; color: var(--color-text, #1a1a1a); font-family: inherit; padding: 0; }
    .cbe__label { flex: 1; }
    .cbe__chevron { font-size: 0.7rem; color: var(--color-text-muted, #909090); }

    .cbe__actions { display: flex; gap: 4px; }
    .cbe__btn { background: var(--color-background, #fff); border: 1px solid var(--color-border, #e0e0e0); border-radius: 4px; cursor: pointer; padding: 3px 9px; font-size: 0.8rem; color: var(--color-text, #1a1a1a); font-family: inherit; transition: opacity 120ms; }
    .cbe__btn:hover:not(:disabled) { opacity: 0.7; }
    .cbe__btn:disabled { opacity: 0.3; cursor: default; }
    .cbe__btn--danger { border-color: #e53e3e; color: #e53e3e; background: transparent; }

    .cbe__form { padding: 14px; background: var(--color-background, #fff); }
  `],
})
export class BlockEditorComponent {
  readonly block   = input.required<CmsBlock>();
  readonly isFirst = input.required<boolean>();
  readonly isLast  = input.required<boolean>();
  readonly active  = input(false);

  readonly changed = output<unknown>();
  readonly move    = output<'up' | 'down'>();
  readonly remove  = output<void>();

  readonly label     = computed(() => BLOCK_LABELS[this.block().type] ?? this.block().type);
  readonly blockData = computed(() => this.block().data as never);

  expanded = false;

  toggleExpanded(): void { this.expanded = !this.expanded; }
  onChanged(data: unknown): void { this.changed.emit(data); }
}
