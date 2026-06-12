import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, signal, output, input } from '@angular/core';
import { CookieService } from '../cookie.service/cookie.service';
import { CookieSettingsComponent } from '../cookie-settings/cookie-settings.component';

@Component({
  selector: 'lib-cookie-banner',
  standalone: true,
  imports: [CookieSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (!cookieService.decided()) {
      <div class="ck-banner" role="dialog" aria-label="Aviso de cookies" aria-modal="true">
        @if (!showSettings()) {
          <div class="ck-banner__content">
            <div class="ck-banner__text">
              <p class="ck-banner__title">Usamos cookies</p>
              <p class="ck-banner__desc">
                Usamos cookies propias y de terceros para analizar el uso del sitio y mostrarte
                contenido relevante. Puedes aceptarlas todas, rechazarlas o personalizarlas.
                <a class="ck-banner__link" [href]="cookiePolicyPath">Política de cookies</a>
              </p>
            </div>
            <div class="ck-banner__actions">
              <button class="ck-btn ck-btn--ghost" (click)="openSettings()">Personalizar</button>
              <button class="ck-btn ck-btn--secondary" (click)="rejectAll()">Rechazar todo</button>
              <button class="ck-btn ck-btn--primary" (click)="acceptAll()">Aceptar todo</button>
            </div>
          </div>
        } @else {
          <lib-cookie-settings
            (saved)="onSaved()"
            (cancelled)="showSettings.set(false)"
          />
        }
      </div>
    }
  `,
  styles: [`
    .ck-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      box-shadow: 0 -4px 24px rgba(0,0,0,.12);
      padding: 1rem 1.5rem;
    }
    .ck-banner__content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .ck-banner__text { flex: 1; min-width: 200px; }
    .ck-banner__title { font-weight: 600; margin: 0 0 .25rem; color: var(--color-text); font-size: .95rem; }
    .ck-banner__desc { margin: 0; color: var(--color-text-muted); font-size: .85rem; line-height: 1.5; }
    .ck-banner__link { color: var(--color-accent); text-decoration: underline; }
    .ck-banner__actions { display: flex; gap: .5rem; flex-shrink: 0; flex-wrap: wrap; }
    .ck-btn {
      padding: .5rem 1rem;
      border-radius: var(--radius-md, 6px);
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: opacity .15s;
      white-space: nowrap;
    }
    .ck-btn:hover { opacity: .85; }
    .ck-btn--primary { background: var(--color-accent); color: #fff; }
    .ck-btn--secondary { background: var(--color-surface-alt, #f0f0f0); color: var(--color-text); border: 1px solid var(--color-border); }
    .ck-btn--ghost { background: transparent; color: var(--color-text-muted); text-decoration: underline; padding-left: 0; }
  `],
})
export class CookieBannerComponent {
  readonly cookiePolicyPath = input<string>('/politica-de-cookies');

  readonly cookieService = inject(CookieService);
  readonly showSettings = signal(false);

  acceptAll(): void { this.cookieService.acceptAll(); }
  rejectAll(): void { this.cookieService.rejectAll(); }
  openSettings(): void { this.showSettings.set(true); }
  onSaved(): void { this.showSettings.set(false); }
}
