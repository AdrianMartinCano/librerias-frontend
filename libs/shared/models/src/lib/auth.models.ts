export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  expiresIn?: number;
}

export interface SocialProvider {
  id: string;         // 'google', 'github', 'twitter'...
  label: string;      // 'Continuar con Google'
  url: string;        // endpoint OAuth del backend: '/api/auth/google'
  icon?: string;      // SVG inline como string
  bgColor?: string;   // color de fondo del botón
  textColor?: string; // color del texto
}

export interface AuthConfig {
  loginEndpoint?: string;      // default: '/api/auth/login'
  registerEndpoint?: string;   // default: '/api/auth/register'
  tokenKey?: string;           // default: 'auth_token'
  /**
   * Dónde canjear el `id_token` de Google por una sesión. Lo sirve `spring-google`.
   * Default: '/api/auth/google'.
   */
  googleEndpoint?: string;
  /**
   * Dónde preguntar si hay login con Google y con qué `client_id`. Si el módulo del
   * backend está apagado responde 404, y eso se lee como «aquí no hay Google»: el botón
   * no se pinta y la pantalla sigue funcionando con correo y contraseña.
   * Default: '/api/auth/google/config'.
   */
  googleConfigEndpoint?: string;
  /**
   * Orígenes (absolutos) adicionales a los que el interceptor SÍ debe adjuntar el token,
   * además de las rutas relativas y del mismo origen. Necesario si tu API está en otro dominio
   * o puerto (p. ej. en desarrollo: 'http://localhost:8080'). Por seguridad, a cualquier otro
   * origen (terceros) NO se le envía el token. Default: [].
   * @example trustedOrigins: ['http://localhost:8080', 'https://api.midominio.com']
   */
  trustedOrigins?: string[];
}
