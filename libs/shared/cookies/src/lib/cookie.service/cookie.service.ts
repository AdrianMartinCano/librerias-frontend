import { Injectable, Provider, InjectionToken, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  decidedAt: string; // ISO timestamp
  version: number;   // versión de la política con la que se decidió
}

export interface CookieConsentConfig {
  /** Súbela cuando cambies las categorías o la política: invalida consentimientos anteriores y vuelve a preguntar. */
  version: number;
  /** Días tras los que se vuelve a pedir consentimiento (el RGPD recomienda re-preguntar periódicamente). 0 = nunca caduca. */
  expiresAfterDays: number;
  /** Clave de almacenamiento en localStorage. */
  storageKey: string;
}

const DEFAULTS: CookieConsentConfig = {
  version: 1,
  expiresAfterDays: 180,
  storageKey: 'pimon_cookie_consent',
};

export const COOKIE_CONSENT_CONFIG = new InjectionToken<Partial<CookieConsentConfig>>('COOKIE_CONSENT_CONFIG');

/** Configura versión, caducidad y clave del consentimiento de cookies (todo opcional). */
export function provideCookieConsent(config: Partial<CookieConsentConfig>): Provider {
  return { provide: COOKIE_CONSENT_CONFIG, useValue: config };
}

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly config: CookieConsentConfig = { ...DEFAULTS, ...(inject(COOKIE_CONSENT_CONFIG, { optional: true }) ?? {}) };

  private readonly _consent = signal<CookieConsent | null>(this._load());

  /** true si el usuario ya tomó una decisión vigente (no caducada ni de una versión anterior). */
  readonly decided = computed(() => this._consent() !== null);

  /** Consentimiento actual — null si no ha decidido aún (o caducó / cambió la versión). */
  readonly consent = this._consent.asReadonly();

  hasConsent(category: CookieCategory): boolean {
    if (category === 'necessary') return true;
    return this._consent()?.[category] ?? false;
  }

  acceptAll(): void {
    this._save({ necessary: true, analytics: true, marketing: true, preferences: true });
  }

  rejectAll(): void {
    this._save({ necessary: true, analytics: false, marketing: false, preferences: false });
  }

  saveCustom(prefs: Omit<CookieConsent, 'necessary' | 'decidedAt' | 'version'>): void {
    this._save({ necessary: true, ...prefs });
  }

  reset(): void {
    if (this.isBrowser) {
      try { localStorage.removeItem(this.config.storageKey); } catch { /* almacenamiento no disponible */ }
    }
    this._consent.set(null);
  }

  private _save(partial: Omit<CookieConsent, 'decidedAt' | 'version'>): void {
    const consent: CookieConsent = { ...partial, decidedAt: new Date().toISOString(), version: this.config.version };
    if (this.isBrowser) {
      try { localStorage.setItem(this.config.storageKey, JSON.stringify(consent)); } catch { /* almacenamiento no disponible */ }
    }
    this._consent.set(consent);
  }

  private _load(): CookieConsent | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (!raw) return null;
      const consent = JSON.parse(raw) as CookieConsent;
      if (consent.version !== this.config.version) return null;   // cambió la política → re-preguntar
      if (this._isExpired(consent.decidedAt)) return null;        // consentimiento caducado → re-preguntar
      return consent;
    } catch {
      return null;
    }
  }

  private _isExpired(decidedAt: string): boolean {
    if (this.config.expiresAfterDays <= 0) return false;
    const decided = new Date(decidedAt).getTime();
    if (Number.isNaN(decided)) return true;
    const ageDays = (Date.now() - decided) / 86_400_000;
    return ageDays > this.config.expiresAfterDays;
  }
}
