import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, switchMap } from 'rxjs';
import { AuthUser, LoginCredentials, RegisterCredentials, AuthResponse, AuthConfig } from '@org/models';
import { GoogleAuthService } from './google/google.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly google = inject(GoogleAuthService);

  private config: Required<AuthConfig> = {
    loginEndpoint:        '/api/auth/login',
    registerEndpoint:     '/api/auth/register',
    tokenKey:             'auth_token',
    trustedOrigins:       [],
    googleEndpoint:       '/api/auth/google',
    googleConfigEndpoint: '/api/auth/google/config',
  };

  readonly token       = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn  = computed(() => !!this.token());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem(this.config.tokenKey);
    // Descarta tokens caducados al cargar: evita arrancar "logueado" con un JWT muerto.
    if (saved && !this.isTokenExpired(saved)) {
      this.token.set(saved);
      this.currentUser.set(this.readUser());
    } else if (saved) {
      this.clearStorage();
    }
  }

  configure(config: AuthConfig): void {
    this.config = { ...this.config, ...config };
    // El servicio de Google pregunta por su cuenta si el botón se pinta, así que tiene que
    // enterarse del endpoint aunque quien configura solo hable con AuthService.
    this.google.setConfigEndpoint(this.config.googleConfigEndpoint);
  }

  /**
   * Canjea el `id_token` de Google por una sesión, y la deja abierta.
   *
   * El token de Google se usa **una sola vez**, aquí, y se tira: a partir de ese momento la
   * sesión es el JWT de la aplicación, igual que si hubiera entrado con su contraseña. Por
   * eso la respuesta se normaliza con lo mismo que `login()` — al resto de la aplicación le
   * da exactamente igual por dónde haya entrado cada cual.
   *
   * Quien verifica que ese token es de Google y es para esta web es el backend
   * (`spring-google`). Aquí no se mira: un JWT que llega del navegador no demuestra nada
   * hasta que alguien comprueba su firma.
   */
  loginWithGoogle(credential: string): Observable<AuthResponse> {
    return this.http
      .post<unknown>(this.config.googleEndpoint, { credential })
      .pipe(
        map((res) => this.toAuthResponse(res)),
        tap((res) => this.setSession(res)),
      );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<unknown>(this.config.loginEndpoint, credentials)
      .pipe(
        map((res) => this.toAuthResponse(res)),
        tap((res) => this.setSession(res)),
      );
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http
      .post<unknown>(this.config.registerEndpoint, credentials)
      .pipe(
        switchMap((res) => {
          const body = this.unwrap(res);
          // Si el registro ya devuelve token, úsalo directamente.
          if (body['token']) {
            const auth = this.toAuthResponse(res);
            this.setSession(auth);
            return of(auth);
          }
          // Si no (el backend devuelve solo el usuario creado), inicia sesión con
          // las mismas credenciales para dejar al usuario logueado.
          return this.login({ email: credentials.email, password: credentials.password });
        }),
      );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.clearStorage();
    // Que Google vuelva a preguntar la próxima vez. Sin esto, quien cierra sesión en un
    // ordenador compartido vuelve a entrar solo con pulsar el botón. No hace nada si la
    // librería de Google no llegó a cargarse.
    this.google.forgetSession();
  }

  setSession(response: AuthResponse): void {
    this.token.set(response.token);
    this.currentUser.set(response.user);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.config.tokenKey, response.token);
    localStorage.setItem(`${this.config.tokenKey}_user`, JSON.stringify(response.user));
  }

  /**
   * Desenvuelve el sobre `ApiResponse` del backend (`{ data: ... }`) si está presente.
   * El backend de @adrianmartincano envuelve todas las respuestas; el resto de
   * consumidores leen `.data` a mano, así que aquí hacemos lo propio.
   */
  private unwrap(raw: unknown): Record<string, any> {
    const obj = (raw ?? {}) as Record<string, any>;
    return (obj['data'] ?? obj) as Record<string, any>;
  }

  /**
   * Normaliza la respuesta de autenticación al modelo `AuthResponse` (`{ token, user }`).
   * Acepta tanto la forma ya anidada (`{ token, user }`) como la plana del backend
   * (`{ token, id, email, roles, name? }`), esté o no envuelta en `ApiResponse`.
   */
  private toAuthResponse(raw: unknown): AuthResponse {
    const body = this.unwrap(raw);
    if (body['user']) {
      return body as AuthResponse;
    }
    return {
      token: body['token'],
      expiresIn: body['expiresIn'],
      user: {
        id: body['id'],
        email: body['email'],
        name: body['name'] ?? body['email'],
        roles: body['roles'] ?? [],
      },
    };
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  /**
   * ¿Debe el interceptor adjuntar el token a esta URL?
   * Sí a rutas relativas, al mismo origen y a los `trustedOrigins` configurados.
   * NO a orígenes de terceros — evita filtrar el JWT fuera de tu backend.
   */
  shouldAttachToken(url: string): boolean {
    const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) || url.startsWith('//');
    if (!isAbsolute) return true; // relativa → propio backend
    const origin = this.currentOrigin();
    try {
      const target = new URL(url, origin || undefined).origin;
      return target === origin || this.config.trustedOrigins.includes(target);
    } catch {
      return false;
    }
  }

  /** ¿El token (por defecto el activo) es un JWT caducado? Tokens sin `exp` se consideran válidos. */
  isTokenExpired(token: string | null = this.token()): boolean {
    if (!token) return true;
    const exp = this.jwtExp(token);
    if (exp == null) return false;
    return Date.now() >= exp * 1000;
  }

  private readUser(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(`${this.config.tokenKey}_user`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null; // storage corrupto → no rompemos el arranque
    }
  }

  private clearStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(`${this.config.tokenKey}_user`);
  }

  private currentOrigin(): string {
    return isPlatformBrowser(this.platformId) ? location.origin : '';
  }

  /** Extrae `exp` (segundos epoch) del payload de un JWT. null si no es un JWT legible. */
  private jwtExp(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload || typeof atob === 'undefined') return null;
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof json.exp === 'number' ? json.exp : null;
    } catch {
      return null;
    }
  }
}
