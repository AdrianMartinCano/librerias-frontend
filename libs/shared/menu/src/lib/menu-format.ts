import { Allergen, CategoryIcon, FontChoice } from '@org/models';

/**
 * Mapas de presentación de la carta. Las fuentes son una whitelist (no CSS libre): cada valor se
 * resuelve a una pila de fuentes con fallbacks del sistema. Si quieres webfonts reales (Playfair,
 * Roboto Slab…), cárgalas en tu `index.html`/`styles.css` y estos stacks las usarán.
 */
export const FONT_STACK: Record<FontChoice, string> = {
  SYSTEM:      'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  SERIF:       'Georgia, "Times New Roman", serif',
  SANS:        '"Helvetica Neue", Arial, sans-serif',
  SLAB:        '"Roboto Slab", Rockwell, Georgia, serif',
  DISPLAY:     '"Playfair Display", Georgia, serif',
  HANDWRITTEN: '"Segoe Script", "Brush Script MT", cursive',
  MONO:        '"JetBrains Mono", "Courier New", monospace',
};

/** Icono curado de categoría → emoji (placeholder themeable; el consumidor puede sustituir por SVG). */
export const CATEGORY_ICON: Record<CategoryIcon, string> = {
  NONE:      '',
  ENTRANTES: '🥗',
  ENSALADAS: '🥬',
  SOPAS:     '🍲',
  CARNES:    '🥩',
  PESCADOS:  '🐟',
  ARROCES:   '🍚',
  PASTAS:    '🍝',
  TAPAS:     '🍤',
  POSTRES:   '🍰',
  QUESOS:    '🧀',
  VINOS:     '🍷',
  CERVEZAS:  '🍺',
  COCTELES:  '🍸',
  CAFES:     '☕',
  INFANTIL:  '🧒',
  VEGANO:    '🌱',
};

/** Etiquetas legibles de los 14 alérgenos UE. */
export const ALLERGEN_LABEL: Record<Allergen, string> = {
  GLUTEN:         'Gluten',
  CRUSTACEOS:     'Crustáceos',
  HUEVOS:         'Huevos',
  PESCADO:        'Pescado',
  CACAHUETES:     'Cacahuetes',
  SOJA:           'Soja',
  LACTEOS:        'Lácteos',
  FRUTOS_CASCARA: 'Frutos de cáscara',
  APIO:           'Apio',
  MOSTAZA:        'Mostaza',
  SESAMO:         'Sésamo',
  SULFITOS:       'Sulfitos',
  ALTRAMUCES:     'Altramuces',
  MOLUSCOS:       'Moluscos',
};

/** Formatea un importe con la moneda de la presentación (Intl nativo, sin registerLocaleData). */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
