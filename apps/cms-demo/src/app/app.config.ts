import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { provideCmsBlocks } from '@org/cms';
import { CalendarBlockComponent } from '@org/reservations';
import { appRoutes } from './app.routes';

const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  if (token && req.url.includes('/api/admin')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([adminAuthInterceptor])),
    // El bloque 'calendar' vive en ng-reservations y es opt-in: lo registramos aquí
    // para que <lib-cms-page> sepa renderizarlo. ng-cms no depende de reservations.
    provideCmsBlocks({ calendar: CalendarBlockComponent }),
  ],
};
