import { SocialProvider } from '@org/models';
import {
  ICON_GOOGLE, ICON_GITHUB, ICON_TWITTER, ICON_FACEBOOK,
  ICON_APPLE, ICON_MICROSOFT, ICON_YOUTUBE,
} from './social-icons';

/**
 * Helpers para crear proveedores sociales predefinidos.
 * El parámetro `url` es el endpoint OAuth de TU backend.
 *
 * @example
 * socialProviders = [
 *   GOOGLE('/api/auth/google'),
 *   GITHUB('/api/auth/github'),
 * ]
 */

export const GOOGLE = (url: string, label = 'Continuar con Google'): SocialProvider => ({
  id: 'google', label, url,
  icon: ICON_GOOGLE,
  bgColor: '#ffffff',
  textColor: '#1e1e1e',
});

// YouTube usa OAuth de Google — apunta al mismo endpoint con scopes de YouTube
export const YOUTUBE = (url: string, label = 'Continuar con YouTube'): SocialProvider => ({
  id: 'youtube', label, url,
  icon: ICON_YOUTUBE,
  bgColor: '#ff0000',
  textColor: '#ffffff',
});

export const GITHUB = (url: string, label = 'Continuar con GitHub'): SocialProvider => ({
  id: 'github', label, url,
  icon: ICON_GITHUB,
  bgColor: '#24292e',
  textColor: '#ffffff',
});

export const TWITTER = (url: string, label = 'Continuar con X'): SocialProvider => ({
  id: 'twitter', label, url,
  icon: ICON_TWITTER,
  bgColor: '#000000',
  textColor: '#ffffff',
});

export const FACEBOOK = (url: string, label = 'Continuar con Facebook'): SocialProvider => ({
  id: 'facebook', label, url,
  icon: ICON_FACEBOOK,
  bgColor: '#1877f2',
  textColor: '#ffffff',
});

export const APPLE = (url: string, label = 'Continuar con Apple'): SocialProvider => ({
  id: 'apple', label, url,
  icon: ICON_APPLE,
  bgColor: '#000000',
  textColor: '#ffffff',
});

export const MICROSOFT = (url: string, label = 'Continuar con Microsoft'): SocialProvider => ({
  id: 'microsoft', label, url,
  icon: ICON_MICROSOFT,
  bgColor: '#2f2f2f',
  textColor: '#ffffff',
});
