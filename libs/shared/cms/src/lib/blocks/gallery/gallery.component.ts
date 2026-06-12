import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, signal, computed, HostListener } from '@angular/core';
import { GalleryData } from '@org/models';

@Component({
  selector: 'lib-cms-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './gallery.component.css',
  template: `
    <section class="section">
      <div class="container">
        @if (data().title) { <h2 class="cms-gallery__title">{{ data().title }}</h2> }
        <div class="cms-gallery__grid" [class]="'cms-gallery__grid--' + (data().cols || 3)">
          @for (img of data().images; track img.src; let i = $index) {
            <figure class="cms-gallery__item" (click)="open(i)" tabindex="0" (keyup.enter)="open(i)">
              <img [src]="img.src" [alt]="img.alt || ''" class="cms-gallery__img" loading="lazy" />
              @if (img.caption) { <figcaption class="cms-gallery__caption">{{ img.caption }}</figcaption> }
            </figure>
          }
        </div>
      </div>

      @if (current() !== null) {
        <div class="cms-gallery__lightbox" (click)="close()" role="dialog" aria-modal="true">
          <img [src]="current()!.src" [alt]="current()!.alt || ''" class="cms-gallery__lightbox-img" (click)="$event.stopPropagation()" />
          <button class="cms-gallery__lightbox-close" (click)="close()" aria-label="Cerrar">✕</button>
          @if (data().images.length > 1) {
            <button class="cms-gallery__lightbox-prev" (click)="prev($event)" aria-label="Anterior">&#8249;</button>
            <button class="cms-gallery__lightbox-next" (click)="next($event)" aria-label="Siguiente">&#8250;</button>
          }
        </div>
      }
    </section>
  `,
})
export class GalleryComponent {
  readonly data  = input.required<GalleryData>();
  private readonly idx = signal<number | null>(null);
  readonly current = computed(() => {
    const i = this.idx();
    return i !== null ? this.data().images[i] : null;
  });

  open(i: number): void { this.idx.set(i); }
  close(): void { this.idx.set(null); }

  prev(e?: Event): void {
    e?.stopPropagation();
    this.idx.update(i => i !== null ? (i - 1 + this.data().images.length) % this.data().images.length : 0);
  }

  next(e?: Event): void {
    e?.stopPropagation();
    this.idx.update(i => i !== null ? (i + 1) % this.data().images.length : 0);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.idx() === null) return;
    if (e.key === 'Escape')     { this.close(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
  }
}

