import { Component, ChangeDetectionStrategy, inject, signal, input, afterNextRender, effect, viewChild, ElementRef, DestroyRef } from '@angular/core';
import { NewsletterFormComponent } from '../newsletter-form/newsletter-form.component';
import { NewsletterService } from '../newsletter.service';

@Component({
  selector: 'lib-newsletter-popup',
  standalone: true,
  imports: [NewsletterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter-popup.component.html',
  styleUrl: './newsletter-popup.component.css',
})
export class NewsletterPopupComponent {
  /** Milisegundos de espera antes de mostrar el popup. */
  readonly delay = input(8000);
  readonly title = input('No te pierdas nuestras novedades');
  readonly description = input('Suscríbete y recibe ofertas y noticias en tu email.');
  readonly submitLabel = input('Suscribirme');
  readonly successMessage = input('¡Gracias! Ya estás suscrito.');
  readonly source = input('popup');

  private readonly newsletterService = inject(NewsletterService);

  readonly visible = signal(false);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private lastFocused: HTMLElement | null = null;
  private showTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => {
      if (this.newsletterService.isPopupDismissed()) return;
      this.showTimer = setTimeout(() => this.visible.set(true), this.delay());
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.showTimer);
      clearTimeout(this.closeTimer);
    });

    // Gestión de foco: al abrir, mover el foco al diálogo; al cerrar, devolverlo.
    effect(() => {
      if (this.visible()) {
        this.lastFocused = document.activeElement as HTMLElement | null;
        setTimeout(() => this.firstFocusable()?.focus(), 0);
      } else if (this.lastFocused) {
        this.lastFocused.focus();
        this.lastFocused = null;
      }
    });
  }

  close(): void {
    this.visible.set(false);
    this.newsletterService.dismissPopup();
  }

  onSubscribed(): void {
    this.newsletterService.dismissPopup();
    this.closeTimer = setTimeout(() => this.close(), 2500);
  }

  /** Escape cierra; Tab queda atrapado dentro del diálogo (modal). */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = this.focusableElements();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusableElements(): HTMLElement[] {
    const root = this.dialog()?.nativeElement;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'));
  }

  private firstFocusable(): HTMLElement | null {
    return this.focusableElements()[0] ?? null;
  }
}
