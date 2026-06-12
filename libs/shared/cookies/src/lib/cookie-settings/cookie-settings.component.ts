import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, signal, output } from '@angular/core';
import { CookieService } from '../cookie.service/cookie.service';

interface CategoryDef {
  key: 'analytics' | 'marketing' | 'preferences';
  label: string;
  desc: string;
  required: false;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'analytics',
    label: 'Analítica',
    desc: 'Nos permiten medir el uso del sitio (páginas visitadas, tiempo de visita) para mejorar la experiencia.',
    required: false,
  },
  {
    key: 'marketing',
    label: 'Marketing',
    desc: 'Permiten mostrar publicidad personalizada y medir la eficacia de las campañas.',
    required: false,
  },
  {
    key: 'preferences',
    label: 'Preferencias',
    desc: 'Recuerdan tus ajustes personales como el idioma o el tema visual seleccionado.',
    required: false,
  },
];

@Component({
  selector: 'lib-cookie-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ck-settings">
      <p class="ck-settings__title">Personaliza tus preferencias de cookies</p>

      <!-- Necesarias — siempre activas -->
      <div class="ck-settings__row ck-settings__row--required">
        <div class="ck-settings__info">
          <span class="ck-settings__label">Necesarias</span>
          <span class="ck-settings__desc">Imprescindibles para el funcionamiento del sitio. No se pueden desactivar.</span>
        </div>
        <div class="ck-toggle ck-toggle--on ck-toggle--disabled" aria-checked="true" aria-label="Necesarias — siempre activas">
          <span class="ck-toggle__knob"></span>
        </div>
      </div>

      @for (cat of categories; track cat.key) {
        <div class="ck-settings__row">
          <div class="ck-settings__info">
            <span class="ck-settings__label">{{ cat.label }}</span>
            <span class="ck-settings__desc">{{ cat.desc }}</span>
          </div>
          <button
            class="ck-toggle"
            [class.ck-toggle--on]="prefs()[cat.key]"
            role="switch"
            [attr.aria-checked]="prefs()[cat.key]"
            [attr.aria-label]="cat.label"
            (click)="toggle(cat.key)"
          >
            <span class="ck-toggle__knob"></span>
          </button>
        </div>
      }

      <div class="ck-settings__actions">
        <button class="ck-btn ck-btn--ghost" (click)="cancelled.emit()">Cancelar</button>
        <button class="ck-btn ck-btn--secondary" (click)="rejectAll()">Rechazar todo</button>
        <button class="ck-btn ck-btn--secondary" (click)="acceptAll()">Aceptar todo</button>
        <button class="ck-btn ck-btn--primary" (click)="save()">Guardar preferencias</button>
      </div>
    </div>
  `,
  styles: [`
    .ck-settings { max-width: 1200px; margin: 0 auto; }
    .ck-settings__title { font-weight: 600; margin: 0 0 .75rem; color: var(--color-text); font-size: .95rem; }
    .ck-settings__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .6rem 0;
      border-top: 1px solid var(--color-border);
    }
    .ck-settings__info { flex: 1; }
    .ck-settings__label { display: block; font-weight: 500; font-size: .875rem; color: var(--color-text); }
    .ck-settings__desc { display: block; font-size: .8rem; color: var(--color-text-muted); margin-top: .1rem; line-height: 1.4; }
    .ck-settings__actions { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: flex-end; padding-top: .75rem; border-top: 1px solid var(--color-border); }

    /* Toggle */
    .ck-toggle {
      flex-shrink: 0;
      width: 44px; height: 24px;
      border-radius: 12px;
      background: var(--color-border);
      border: none;
      cursor: pointer;
      position: relative;
      transition: background .2s;
      padding: 0;
    }
    .ck-toggle--on { background: var(--color-accent); }
    .ck-toggle--disabled { cursor: default; opacity: .6; }
    .ck-toggle__knob {
      position: absolute;
      top: 3px; left: 3px;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform .2s;
      display: block;
    }
    .ck-toggle--on .ck-toggle__knob { transform: translateX(20px); }

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
    .ck-btn--ghost { background: transparent; color: var(--color-text-muted); text-decoration: underline; padding-left: 0; margin-right: auto; }
  `],
})
export class CookieSettingsComponent {
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly categories = CATEGORIES;
  private readonly cookieService = inject(CookieService);

  readonly prefs = signal({
    analytics: this.cookieService.hasConsent('analytics'),
    marketing: this.cookieService.hasConsent('marketing'),
    preferences: this.cookieService.hasConsent('preferences'),
  });

  toggle(key: 'analytics' | 'marketing' | 'preferences'): void {
    this.prefs.update(p => ({ ...p, [key]: !p[key] }));
  }

  acceptAll(): void {
    this.prefs.set({ analytics: true, marketing: true, preferences: true });
  }

  rejectAll(): void {
    this.prefs.set({ analytics: false, marketing: false, preferences: false });
  }

  save(): void {
    this.cookieService.saveCustom(this.prefs());
    this.saved.emit();
  }
}
