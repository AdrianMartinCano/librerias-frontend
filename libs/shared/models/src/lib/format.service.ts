import {
  InjectionToken,
  Injectable,
  Provider,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Currency, LibFormatConfig } from './format.models';

/** Configuración por defecto: euros en formato español. Funciona sin tocar nada. */
export const DEFAULT_FORMAT: LibFormatConfig = {
  currencies: [{ code: 'EUR', locale: 'es-ES', label: 'Euro', symbol: '€', rate: 1 }],
  defaultCurrencyCode: 'EUR',
  dateLocale: 'es-ES',
};

/** Token de configuración. La factory devuelve el default → cero configuración necesaria. */
export const LIB_FORMAT = new InjectionToken<LibFormatConfig>('LIB_FORMAT', {
  providedIn: 'root',
  factory: () => DEFAULT_FORMAT,
});

/**
 * Configura moneda(s) e idioma de fechas en el bootstrap de la app:
 *
 *   provideLibFormat({
 *     defaultCurrencyCode: 'EUR',
 *     currencies: [
 *       { code: 'EUR', locale: 'es-ES', label: 'Euro',  symbol: '€', rate: 1 },
 *       { code: 'USD', locale: 'en-US', label: 'Dólar', symbol: '$', rate: 1.08 },
 *     ],
 *   })
 */
export function provideLibFormat(config: Partial<LibFormatConfig>): Provider {
  return { provide: LIB_FORMAT, useValue: { ...DEFAULT_FORMAT, ...config } };
}

/**
 * Estado de moneda activa + helpers de formato, compartidos por todas las librerías.
 * Reactivo (signals): al cambiar de moneda, las vistas que llaman a `money()` se re-renderizan.
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly config = inject(LIB_FORMAT);
  private readonly STORAGE_KEY = 'lib-currency';

  private readonly _currencies = signal<Currency[]>(this.config.currencies);
  private readonly _currencyCode = signal<string>(this.initialCode());

  /** Monedas disponibles (las pasadas a provideLibFormat, o solo EUR por defecto). */
  readonly currencies = this._currencies.asReadonly();

  /** Código de la moneda activa. */
  readonly currencyCode = this._currencyCode.asReadonly();

  /** Objeto de la moneda activa. */
  readonly currency = computed<Currency>(() => {
    const list = this.currencies();
    return (
      list.find((c) => c.code === this.currencyCode()) ??
      list[0] ??
      DEFAULT_FORMAT.currencies[0]
    );
  });

  /** Cambia la moneda activa (si existe) y la persiste. */
  setCurrency(code: string): void {
    if (!this.currencies().some((c) => c.code === code)) return;
    this._currencyCode.set(code);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, code);
    }
  }

  /**
   * Reemplaza la lista de monedas en runtime (p. ej. con tasas frescas del backend).
   * Es reactivo: todos los importes ya pintados se reformatean al instante.
   */
  setCurrencies(currencies: Currency[]): void {
    if (currencies.length === 0) return;
    this._currencies.set(currencies);
  }

  /**
   * Actualiza solo las `rate` de las monedas existentes, por código. Reactivo.
   *   format.setRates({ USD: 1.16, GBP: 0.86 });
   */
  setRates(rates: Record<string, number>): void {
    this._currencies.update((list) =>
      list.map((c) => (rates[c.code] != null ? { ...c, rate: rates[c.code] } : c)),
    );
  }

  /**
   * Formatea un importe (expresado en la moneda base) en la moneda activa.
   * Si la moneda activa tiene `rate`, convierte; si no, formatea sin convertir.
   */
  money(value: number, options?: Intl.NumberFormatOptions): string {
    const cur = this.currency();
    const amount = cur.rate != null ? value * cur.rate : value;
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      ...options,
    }).format(amount);
  }

  /** Formatea una fecha con el locale configurado (no depende de la moneda activa). */
  date(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  ): string {
    const d = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(this.config.dateLocale, options).format(d);
  }

  private initialCode(): string {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.config.currencies.some((c) => c.code === saved)) return saved;
    }
    return this.config.defaultCurrencyCode;
  }
}
