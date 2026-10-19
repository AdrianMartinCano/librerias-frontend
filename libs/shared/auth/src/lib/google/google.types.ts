/**
 * La parte de la librería de Google (Google Identity Services) que se usa aquí.
 *
 * Se escribe a mano en lugar de instalar `@types/google.one-tap`: son cuatro funciones, y
 * una dependencia de tipos más es una cosa más que se queda desactualizada. Si Google
 * cambiara la forma de estas llamadas, lo que hay que arreglar está en este fichero.
 */

/** Lo que Google devuelve cuando alguien termina de identificarse. */
export interface GoogleCredentialResponse {
  /** El `id_token`: un JWT firmado por Google. Es lo que se manda al backend. */
  credential: string;
}

export interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  text: 'signin_with' | 'signup_with' | 'continue_with';
  shape: 'rectangular' | 'pill';
  locale: string;
  /** En píxeles. Google lo limita a 400. */
  width?: number;
}

export interface GoogleIdentityApi {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    /**
     * El aviso flotante de «continuar como…». Se desactiva a propósito: aparece solo,
     * tapa contenido y sale también a quien no está intentando entrar.
     */
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;

  renderButton(container: HTMLElement, options: GoogleButtonOptions): void;

  /** Olvida la sesión de Google para que la próxima vez vuelva a preguntar. */
  disableAutoSelect(): void;
}

/** Lo que el backend contesta en `/api/auth/google/config`. */
export interface GoogleConfig {
  enabled: boolean;
  clientId: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentityApi;
      };
    };
  }
}

export {};
