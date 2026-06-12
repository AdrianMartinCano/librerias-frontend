import { Injectable, signal, computed } from '@angular/core';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  decidedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'pimon_cookie_consent';

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly _consent = signal<CookieConsent | null>(this._load());

  /** true si el usuario ya tomó una decisión (aceptar o rechazar) */
  readonly decided = computed(() => this._consent() !== null);

  /** Consentimiento actual — null si no ha decidido aún */
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

  saveCustom(prefs: Omit<CookieConsent, 'necessary' | 'decidedAt'>): void {
    this._save({ necessary: true, ...prefs });
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._consent.set(null);
  }

  private _save(partial: Omit<CookieConsent, 'decidedAt'>): void {
    const consent: CookieConsent = { ...partial, decidedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    this._consent.set(consent);
  }

  private _load(): CookieConsent | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CookieConsent) : null;
    } catch {
      return null;
    }
  }
}
