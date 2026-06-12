import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Language } from '@org/models';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'lib-lang';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  readonly currentCode = signal<string>('es');

  readonly currentLang = computed(() => {
    return this.available().find((l) => l.code === this.currentCode()) ?? null;
  });

  private readonly available = signal<Language[]>([]);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) this.currentCode.set(saved);
  }

  setAvailable(langs: Language[]): void {
    this.available.set(langs);
    if (!langs.find((l) => l.code === this.currentCode())) {
      this.currentCode.set(langs[0]?.code ?? 'es');
    }
  }

  set(code: string): void {
    this.currentCode.set(code);
    this.doc.documentElement.setAttribute('lang', code);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, code);
    }
  }
}
