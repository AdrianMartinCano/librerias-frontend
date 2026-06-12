import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protege rutas que requieren estar autenticado. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Protege rutas que requieren un rol concreto. */
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(requiredRole)) return true;

    return router.createUrlTree(['/no-autorizado']);
  };
};

/** Protege rutas que requieren CUALQUIERA de los roles indicados. */
export const anyRoleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (auth.hasAnyRole(...roles)) return true;

    return router.createUrlTree(['/no-autorizado']);
  };
};

/** Redirige al home si ya está autenticado (para login/registro). */
export const guestGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  return router.createUrlTree(['/']);
};
