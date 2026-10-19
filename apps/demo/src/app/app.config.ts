import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideLibFormat, provideFxSync } from '@org/models';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    // Varias monedas para demostrar el selector del navbar.
    // OJO: las tasas son ESTÁTICAS y de ejemplo (relativas a EUR). En producción se
    // alimentan desde el backend / una API de cambio, no se cablean aquí a mano.
    provideLibFormat({
      defaultCurrencyCode: 'EUR',
      currencies: [
        { code: 'EUR', locale: 'es-ES', label: 'Euro',          symbol: '€', rate: 1 },
        { code: 'USD', locale: 'en-US', label: 'US Dollar',     symbol: '$', rate: 1.16 },
        { code: 'GBP', locale: 'en-GB', label: 'British Pound', symbol: '£', rate: 0.86 },
      ],
    }),
    // Carga tasas frescas del backend (módulo spring-fx) al arrancar. Best-effort:
    // si el backend no está disponible, se mantienen las tasas estáticas de arriba.
    provideFxSync({ url: '/api/fx' }),
  ],
};
