import { Component, ChangeDetectionStrategy, inject, signal, input, afterNextRender } from '@angular/core';
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

  constructor() {
    afterNextRender(() => {
      if (this.newsletterService.isPopupDismissed()) return;
      setTimeout(() => this.visible.set(true), this.delay());
    });
  }

  close(): void {
    this.visible.set(false);
    this.newsletterService.dismissPopup();
  }

  onSubscribed(): void {
    this.newsletterService.dismissPopup();
    setTimeout(() => this.close(), 2500);
  }
}
