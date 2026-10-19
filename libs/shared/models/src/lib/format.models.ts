/**
 * Configuración de formato (moneda e idioma de fechas) compartida por todas las librerías.
 * Tipos puros, sin dependencia de Angular.
 */

export interface Currency {
  /** Código ISO 4217: 'EUR', 'USD', 'GBP'… */
  code: string;
  /** Locale BCP-47 para Intl: 'es-ES', 'en-US'… */
  locale: string;
  /** Nombre mostrado en el selector. Ej: 'Euro'. */
  label?: string;
  /** Símbolo corto para el disparador del navbar. Ej: '€'. */
  symbol?: string;
  /**
   * Tasa relativa a la moneda base (la base tiene rate 1).
   * Si se define, los importes se convierten antes de formatear.
   * Si se omite, el importe se formatea sin convertir.
   */
  rate?: number;
}

export interface LibFormatConfig {
  /** Monedas disponibles (la primera, o la de rate 1, actúa como base). */
  currencies: Currency[];
  /** Código de la moneda activa por defecto. */
  defaultCurrencyCode: string;
  /** Locale para formatear fechas (independiente de la moneda). */
  dateLocale: string;
}
