import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, input, signal } from '@angular/core';
import { CookieService } from '../cookie.service/cookie.service';
import { CookieSettingsComponent } from '../cookie-settings/cookie-settings.component';

interface CookieCategoryInfo {
  label: string;
  purpose: string;
  duration: string;
  required: boolean;
}

const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    label: 'Necesarias',
    purpose: 'Imprescindibles para el funcionamiento del sitio: sesión, seguridad y preferencias básicas.',
    duration: 'Sesión / 1 año',
    required: true,
  },
  {
    label: 'Analítica',
    purpose: 'Medir el uso del sitio — páginas visitadas, tiempo de permanencia y origen del tráfico — para mejorar la experiencia.',
    duration: 'Hasta 2 años',
    required: false,
  },
  {
    label: 'Marketing',
    purpose: 'Mostrar publicidad personalizada y medir la eficacia de las campañas.',
    duration: 'Hasta 1 año',
    required: false,
  },
  {
    label: 'Preferencias',
    purpose: 'Recordar ajustes personales como el idioma o el tema visual seleccionado.',
    duration: '1 año',
    required: false,
  },
];

@Component({
  selector: 'lib-cookie-policy',
  standalone: true,
  imports: [CookieSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <article class="cp-page py-12">
      <h1 class="mb-2">Política de Cookies</h1>
      <p class="text-sm text-muted mb-8">Última actualización: {{ lastUpdated() }}</p>

      <section class="mb-10">
        <h2 class="cp-section-h2 mb-4">¿Qué son las cookies?</h2>
        <p class="text-sm">
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo
          cuando los visitas. Sirven para que el sitio funcione correctamente, para recordar tus
          preferencias y para obtener información sobre cómo se usa el sitio.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="cp-section-h2 mb-4">Cookies que usamos</h2>
        <div class="cp-categories">
          @for (cat of categories; track cat.label) {
            <div class="cp-card bg-surface rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-bold">{{ cat.label }}</span>
                @if (cat.required) {
                  <span class="cp-badge">Siempre activas</span>
                }
              </div>
              <p class="text-sm mb-2">{{ cat.purpose }}</p>
              <p class="text-xs text-muted">
                <strong>Duración:</strong> {{ cat.duration }}
              </p>
            </div>
          }
        </div>
      </section>

      <section class="mb-10">
        <h2 class="cp-section-h2 mb-4">Gestiona tus preferencias</h2>
        <p class="text-sm mb-4">
          Puedes cambiar tus preferencias en cualquier momento. También puedes configurar tu
          navegador para bloquear o eliminar cookies, aunque esto puede afectar al funcionamiento
          de algunas partes del sitio.
        </p>

        @if (!showSettings()) {
          <button class="cp-btn" (click)="showSettings.set(true)">
            Gestionar mis preferencias de cookies
          </button>
        } @else {
          <div class="cp-card bg-surface rounded-lg p-4">
            <lib-cookie-settings
              (saved)="showSettings.set(false)"
              (cancelled)="showSettings.set(false)"
            />
          </div>
        }
      </section>

      <section>
        <h2 class="cp-section-h2 mb-4">Más información</h2>
        <p class="text-sm">
          Para más información sobre el tratamiento de tus datos personales, consulta nuestra
          <a href="/privacidad">Política de Privacidad</a>.
          Para ejercer tus derechos o resolver dudas, escríbenos a
          <a [href]="'mailto:' + contactEmail()">{{ contactEmail() }}</a>.
        </p>
      </section>
    </article>
  `,
  styles: [`
    .cp-page {
      max-width: 800px;
      margin-inline: auto;
      padding-inline: var(--space-6);
    }
    .cp-section-h2 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-2);
    }
    .cp-categories {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .cp-card { border: 1px solid var(--color-border); }
    .cp-badge {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      color: var(--color-accent);
    }
    .cp-btn {
      padding: var(--space-3) var(--space-6);
      background: var(--color-accent);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .cp-btn:hover { opacity: .85; }
  `],
})
export class CookiePolicyComponent {
  readonly contactEmail = input.required<string>();
  readonly lastUpdated = input<string>(
    new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  );

  readonly categories = COOKIE_CATEGORIES;
  readonly showSettings = signal(false);

  private readonly cookieService = inject(CookieService);
}
