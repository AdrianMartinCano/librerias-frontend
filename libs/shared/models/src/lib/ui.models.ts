export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'badge';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: (value: unknown, row: T) => string;
  badgeMap?: Record<string, string>;
}

export interface NavItem {
  label: string;
  path?: string;
  icon?: string;
  children?: NavItem[];
  external?: boolean;
  badge?: string | number;
}

export interface FooterLink {
  label: string;
  path?: string;
  external?: boolean;
}

export interface FooterSection {
  title?: string;
  links?: FooterLink[];
  text?: string;
}

export type SocialPlatform =
  | 'instagram' | 'twitter' | 'x' | 'facebook' | 'youtube'
  | 'tiktok' | 'linkedin' | 'github' | 'pinterest' | 'whatsapp' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label?: string;   // si está vacío, usa el nombre de la plataforma
}

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface Language {
  code: string;
  label: string;
  flag?: string;
}
