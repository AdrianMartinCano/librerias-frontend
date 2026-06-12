import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginCredentials, RegisterCredentials, AuthResponse, AuthConfig } from '@org/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private config: Required<AuthConfig> = {
    loginEndpoint:    '/api/auth/login',
    registerEndpoint: '/api/auth/register',
    tokenKey:         'auth_token',
  };

  readonly token       = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn  = computed(() => !!this.token());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem(this.config.tokenKey);
    const user  = localStorage.getItem(`${this.config.tokenKey}_user`);
    if (saved) this.token.set(saved);
    if (user)  this.currentUser.set(JSON.parse(user) as AuthUser);
  }

  configure(config: AuthConfig): void {
    this.config = { ...this.config, ...config };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.config.loginEndpoint, credentials)
      .pipe(tap((res) => this.setSession(res)));
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.config.registerEndpoint, credentials)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(`${this.config.tokenKey}_user`);
  }

  setSession(response: AuthResponse): void {
    this.token.set(response.token);
    this.currentUser.set(response.user);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.config.tokenKey, response.token);
    localStorage.setItem(`${this.config.tokenKey}_user`, JSON.stringify(response.user));
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }
}
