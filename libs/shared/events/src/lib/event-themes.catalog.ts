import { EventThemePreset } from '@org/models';

/**
 * Catálogo de presets de tema. "Los estilos definen la web": elegir un preset
 * cambia paleta (--p1..--p4) y tipografía de todo el evento, en runtime.
 * Se aplican como CSS custom properties desde `EventPageComponent`.
 *
 * Para añadir un estilo nuevo basta con añadir una entrada aquí.
 */
export const EVENT_THEMES: Record<string, EventThemePreset> = {
  'wedding-romantic': {
    id: 'wedding-romantic', label: 'Boda · Romántica',
    p1: '#6b4f4f', p2: '#c8a27a', p3: '#e7dcd3', p4: '#faf6f2',
    headingFont: "'Playfair Display', Georgia, serif",
    font: "'Mulish', -apple-system, sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=Mulish:wght@400;600&display=swap',
    heroStyle: 'photo',
  },
  'wedding-classic': {
    id: 'wedding-classic', label: 'Boda · Clásica',
    p1: '#1f2a44', p2: '#b7973f', p3: '#dcdfe6', p4: '#f7f8fa',
    headingFont: "'Cormorant Garamond', Georgia, serif",
    font: "'Nunito Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Nunito+Sans:wght@400;600&display=swap',
    heroStyle: 'elegant',
  },
  'wedding-boho': {
    id: 'wedding-boho', label: 'Boda · Boho',
    p1: '#7a5c3e', p2: '#b06a4e', p3: '#dfd6c4', p4: '#f6f1e7',
    headingFont: "'Cormorant Garamond', serif",
    font: "'Mulish', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Mulish:wght@400;600&display=swap',
    heroStyle: 'photo',
  },
  'anniversary-gold': {
    id: 'anniversary-gold', label: 'Aniversario · Oro',
    p1: '#1a1a1a', p2: '#c9a227', p3: '#e2e2e2', p4: '#faf8f2',
    headingFont: "'Playfair Display', serif",
    font: "'Nunito Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito+Sans:wght@400;600&display=swap',
    heroStyle: 'elegant',
  },
  'birthday-elegant': {
    id: 'birthday-elegant', label: 'Cumpleaños · Elegante',
    p1: '#22232b', p2: '#d6336c', p3: '#e4e4ea', p4: '#f8f8fb',
    headingFont: "'Poppins', sans-serif",
    font: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap',
    heroStyle: 'minimal',
  },
  'birthday-neon': {
    id: 'birthday-neon', label: 'Cumpleaños · Neón',
    p1: '#0e0e14', p2: '#00e5a0', p3: '#2a2a38', p4: '#15151f',
    headingFont: "'Poppins', sans-serif",
    font: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap',
    heroStyle: 'festive',
  },
  'kids-birthday': {
    id: 'kids-birthday', label: 'Cumpleaños infantil',
    p1: '#2f6fed', p2: '#ff6b6b', p3: '#ffe08a', p4: '#fff9ec',
    headingFont: "'Baloo 2', 'Comic Sans MS', cursive",
    font: "'Nunito', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Nunito:wght@400;700&display=swap',
    heroStyle: 'festive',
  },
  'baptism-pastel': {
    id: 'baptism-pastel', label: 'Bautizo · Pastel',
    p1: '#5b8bb0', p2: '#8ecae6', p3: '#e4eef4', p4: '#f7fbfd',
    headingFont: "'Quicksand', sans-serif",
    font: "'Nunito', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&family=Nunito:wght@400;600&display=swap',
    heroStyle: 'minimal',
  },
  'communion': {
    id: 'communion', label: 'Comunión · Suave',
    p1: '#8a9a5b', p2: '#c9a227', p3: '#e8e6d9', p4: '#faf9f3',
    headingFont: "'Cormorant Garamond', serif",
    font: "'Nunito Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Nunito+Sans:wght@400;600&display=swap',
    heroStyle: 'minimal',
  },
  'baby-shower': {
    id: 'baby-shower', label: 'Baby shower · Neutro',
    p1: '#7d8471', p2: '#e6b89c', p3: '#e9e4da', p4: '#faf7f2',
    headingFont: "'Quicksand', sans-serif",
    font: "'Nunito', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&family=Nunito:wght@400;600&display=swap',
    heroStyle: 'minimal',
  },
  'graduation': {
    id: 'graduation', label: 'Graduación',
    p1: '#14213d', p2: '#c9a227', p3: '#dfe2e8', p4: '#f6f7f9',
    headingFont: "'Poppins', sans-serif",
    font: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap',
    heroStyle: 'elegant',
  },
  'quinceanera': {
    id: 'quinceanera', label: 'Quinceañera',
    p1: '#6a1b4d', p2: '#d63384', p3: '#f0dce8', p4: '#fdf6fa',
    headingFont: "'Playfair Display', serif",
    font: "'Poppins', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;600&display=swap',
    heroStyle: 'festive',
  },
  'corporate': {
    id: 'corporate', label: 'Corporativo',
    p1: '#1e293b', p2: '#2f6fed', p3: '#dde3ec', p4: '#f5f7fa',
    headingFont: "'Poppins', sans-serif",
    font: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap',
    heroStyle: 'minimal',
  },
  'gala': {
    id: 'gala', label: 'Gala · Negro y oro',
    p1: '#101010', p2: '#c9a227', p3: '#2a2a2a', p4: '#181818',
    headingFont: "'Playfair Display', serif",
    font: "'Nunito Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito+Sans:wght@400;600&display=swap',
    heroStyle: 'elegant',
  },
  'party': {
    id: 'party', label: 'Fiesta',
    p1: '#3a0ca3', p2: '#f72585', p3: '#e6dcf5', p4: '#faf6ff',
    headingFont: "'Poppins', sans-serif",
    font: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap',
    heroStyle: 'festive',
  },
};

/** Preset por defecto si no se encuentra el pedido. */
export const DEFAULT_EVENT_THEME = EVENT_THEMES['wedding-classic'];

export function resolveEventTheme(theme: string | undefined): EventThemePreset {
  if (!theme) return DEFAULT_EVENT_THEME;
  return EVENT_THEMES[theme] ?? DEFAULT_EVENT_THEME;
}
