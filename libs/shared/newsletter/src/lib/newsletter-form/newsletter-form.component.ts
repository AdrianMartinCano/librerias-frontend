import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NewsletterService } from '../newsletter.service';

export type NewsletterFormLayout = 'inline' | 'stacked';
export type NewsletterFormStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'lib-newsletter-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter-form.component.html',
  styleUrl: './newsletter-form.component.css',
})
export class NewsletterFormComponent {
  readonly title = input('');
  readonly description = input('');
  readonly placeholder = input('tu@email.com');
  readonly submitLabel = input('Suscribirme');
  readonly successMessage = input('¡Listo! Revisa tu email para confirmar la suscripción.');
  readonly errorMessage = input('No se ha podido completar la suscripción. Inténtalo de nuevo.');
  readonly layout = input<NewsletterFormLayout>('inline');
  /** Identifica el origen de la suscripción (footer, popup, blog...). */
  readonly source = input('');

  readonly subscribed = output<string>();

  private readonly fb = inject(FormBuilder);
  private readonly newsletterService = inject(NewsletterService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly status = signal<NewsletterFormStatus>('idle');
  /** Mensaje de error devuelto por la API (p.ej. "Este email ya está suscrito"), si lo hay. */
  readonly serverMessage = signal<string | null>(null);

  get email() {
    return this.form.controls.email;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.email.value ?? '';
    this.status.set('loading');
    this.serverMessage.set(null);

    this.newsletterService.subscribe(email, this.source() || undefined).subscribe({
      next: (res) => {
        if (res.success === false) {
          this.status.set('error');
          this.serverMessage.set(res.message ?? null);
          return;
        }
        this.status.set('success');
        this.form.reset();
        this.subscribed.emit(email);
      },
      error: (err: HttpErrorResponse) => {
        this.status.set('error');
        const message = err.error?.message;
        this.serverMessage.set(typeof message === 'string' ? message : null);
      },
    });
  }
}
