import { DOCUMENT, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { GoogleButtonOptions, GoogleConfig, GoogleCredentialResponse } from './google.types';

/** De dónde Google sirve su librería. */
const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';

const GOOGLE_DISABLED: GoogleConfig = { enabled: false, clientId: '' };

/**
 * Carga la librería de Google (Identity Services) y pinta su botón.
 *
 * <b>El script no va en el `index.html` a propósito</b>: así solo se descarga si de verdad
 * hay login con Google configurado, y quien nunca abre la pantalla de entrar no le pide
 * nada a Google. Es un tercero al que no hace falta anunciar cada visita.
 *
 * El canje del `id_token` por una sesión no está aquí, sino en `AuthService.loginWithGoogle()`:
 * esto se ocupa del widget, y la sesión es de quien lleva las sesiones.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /** Promesa de carga, cacheada: el script se pide una sola vez por sesión. */
  private loading: Promise<void> | null = null;

  private configEndpoint = '/api/auth/google/config';
  private config$: Observable<GoogleConfig> | null = null;

  /**
   * Lo llama `AuthService.configure()` para que las dos partes miren al mismo sitio.
   * Cambiar el endpoint tira la caché: si no, seguiría respondiendo lo del anterior.
   */
  setConfigEndpoint(endpoint: string): void {
    if (endpoint === this.configEndpoint) return;
    this.configEndpoint = endpoint;
    this.config$ = null;
  }

  /**
   * Si hay login con Google, según el backend.
   *
   * Se comparte entre todas las pantallas que lo pregunten (`shareReplay`), así que se pide
   * una sola vez. <b>Cualquier error se traduce en «no habilitado»</b>, y eso incluye el
   * <b>404 que devuelve `spring-google` cuando está apagado</b>: que no salga el botón es
   * mucho mejor que romper la pantalla de entrar por una función secundaria.
   */
  config(): Observable<GoogleConfig> {
    this.config$ ??= this.http.get<unknown>(this.configEndpoint).pipe(
      map((response) => this.unwrap(response)),
      catchError(() => of(GOOGLE_DISABLED)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.config$;
  }

  /**
   * Pinta el widget de Google dentro del contenedor.
   *
   * Hay que usar el suyo y no uno propio porque su librería <b>solo entrega el token a
   * través de él</b>: dibujar un botón nuestro y abrir la ventana a mano es justo lo que los
   * navegadores bloquean. Lo que sí se hace es taparlo con un botón nuestro; quien monta eso
   * es `GoogleButtonComponent`, y ahí está explicado.
   *
   * @param width       el que debe medir el widget, en píxeles. Lo manda quien lo coloca,
   *                    porque tiene que cubrir el botón que se ve debajo.
   * @param onCredential recibe el `id_token` para canjearlo por una sesión
   */
  async renderButton(
    container: HTMLElement,
    clientId: string,
    theme: 'light' | 'dark',
    width: number,
    onCredential: (credential: string) => void,
  ): Promise<void> {
    await this.loadScript();

    const identity = this.document.defaultView?.google?.accounts.id;
    if (!identity) {
      throw new Error('La librería de Google se cargó pero no dejó nada utilizable');
    }

    identity.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => onCredential(response.credential),
      // Nada de identificar a nadie sin que lo pida: se entra pulsando el botón.
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    identity.renderButton(container, this.buttonOptions(theme, width));
  }

  /** Al cerrar sesión, para que Google vuelva a preguntar en vez de reentrar solo. */
  forgetSession(): void {
    this.document.defaultView?.google?.accounts.id.disableAutoSelect();
  }

  private buttonOptions(theme: 'light' | 'dark', width: number): GoogleButtonOptions {
    return {
      type: 'standard',
      // El tema se sigue mandando aunque el widget vaya invisible: si algún día dejara de
      // taparse —o alguien desactivara los estilos— lo que asome será lo menos discordante
      // posible, y no un rectángulo blanco sobre fondo oscuro.
      theme: theme === 'dark' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      locale: 'es',
      // Google no acepta anchos relativos y lo limita a 400. Ese tope es justo el motivo por
      // el que el botón visible de debajo no puede ser más ancho de 400: si lo fuera, le
      // quedarían los extremos sin nada que recoja el clic.
      width: Math.min(Math.round(width) || 320, 400),
    };
  }

  /** Desenvuelve el sobre `ApiResponse` del backend (`{ data: ... }`) si está presente. */
  private unwrap(raw: unknown): GoogleConfig {
    const obj = (raw ?? {}) as Record<string, unknown>;
    const body = (obj['data'] ?? obj) as Partial<GoogleConfig>;
    return {
      enabled: body.enabled ?? false,
      clientId: body.clientId ?? '',
    };
  }

  /**
   * Mete el `<script>` de Google en la página, una sola vez.
   *
   * La promesa se guarda para que dos llamadas simultáneas —dos pantallas montándose a la
   * vez— no inserten dos scripts.
   */
  private loadScript(): Promise<void> {
    if (this.loading) {
      return this.loading;
    }

    this.loading = new Promise<void>((resolve, reject) => {
      const existing = this.document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_SCRIPT}"]`,
      );
      if (existing) {
        resolve();
        return;
      }

      const script = this.document.createElement('script');
      script.src = GOOGLE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Si no carga (sin red, un bloqueador, la CSP), se limpia la promesa para que el
        // siguiente intento vuelva a probar en lugar de quedarse fallando para siempre.
        this.loading = null;
        reject(new Error('No se ha podido cargar la librería de Google'));
      };

      this.document.head.appendChild(script);
    });

    return this.loading;
  }
}
