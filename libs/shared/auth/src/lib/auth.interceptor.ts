import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Añade el header Authorization: Bearer <token> a las peticiones HTTP del propio backend
 * (rutas relativas, mismo origen y los `trustedOrigins` configurados en AuthService).
 * Por seguridad, NO adjunta el token a peticiones cross-origin de terceros.
 *
 * Uso en app.config.ts:
 * provideHttpClient(withInterceptors([authInterceptor]))
 *
 * Si tu API está en otro dominio/puerto, decláralo:
 * auth.configure({ trustedOrigins: ['http://localhost:8080'] })
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  if (!token || !auth.shouldAttachToken(req.url)) return next(req);

  return next(
    req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    })
  );
};
