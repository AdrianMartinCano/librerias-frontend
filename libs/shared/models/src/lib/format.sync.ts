import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { FormatService } from './format.service';

export interface FxSyncConfig {
  /** Endpoint que devuelve las tasas. Ej: '/api/fx' (módulo spring-fx del backend). */
  url: string;
  /**
   * Extrae el mapa `{ code: rate }` de la respuesta. Por defecto entiende:
   *  - el ApiResponse del backend:  `{ data: { rates: {...} } }`
   *  - respuestas planas:           `{ rates: {...} }`
   */
  select?: (body: unknown) => Record<string, number> | null | undefined;
}

function defaultSelect(body: unknown): Record<string, number> | null {
  const b = body as
    | { data?: { rates?: Record<string, number> }; rates?: Record<string, number> }
    | null;
  return b?.data?.rates ?? b?.rates ?? null;
}

/**
 * Carga las tasas de cambio desde un endpoint al arrancar la app y las aplica al
 * `FormatService` (que las usa para convertir importes). **Best-effort**: si la petición
 * falla, se mantienen las tasas estáticas de `provideLibFormat`, sin bloquear el arranque.
 *
 *   provideFxSync({ url: '/api/fx' })
 */
export function provideFxSync(config: FxSyncConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const fmt = inject(FormatService);
      const select = config.select ?? defaultSelect;
      if (typeof fetch === 'undefined') return;
      return fetch(config.url)
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          const rates = body ? select(body) : null;
          if (rates) fmt.setRates(rates);
        })
        .catch(() => {
          /* best-effort: si no hay backend, se usan las tasas de provideLibFormat */
        });
    }),
  ]);
}
