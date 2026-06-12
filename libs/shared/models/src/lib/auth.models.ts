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
}
