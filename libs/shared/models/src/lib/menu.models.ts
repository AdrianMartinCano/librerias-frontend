/**
 * Modelos de la carta y el menú del día (`@adrianmartincano/ng-menu`). Contraparte del backend
 * `spring-menu`. Dos agregados: la **carta** (permanente) y el **menú del día** (fechado). Sin
 * imágenes: la decoración es tipográfica (fuente/color/layout) + icono curado por categoría.
 */

/** Icono curado de categoría (no es imagen): el front lo mapea a un SVG themeable. */
export type CategoryIcon =
  | 'NONE' | 'ENTRANTES' | 'ENSALADAS' | 'SOPAS' | 'CARNES' | 'PESCADOS' | 'ARROCES'
  | 'PASTAS' | 'TAPAS' | 'POSTRES' | 'QUESOS' | 'VINOS' | 'CERVEZAS' | 'COCTELES'
  | 'CAFES' | 'INFANTIL' | 'VEGANO';

/** Los 14 alérgenos de declaración obligatoria en la UE. */
export type Allergen =
  | 'GLUTEN' | 'CRUSTACEOS' | 'HUEVOS' | 'PESCADO' | 'CACAHUETES' | 'SOJA' | 'LACTEOS'
  | 'FRUTOS_CASCARA' | 'APIO' | 'MOSTAZA' | 'SESAMO' | 'SULFITOS' | 'ALTRAMUCES' | 'MOLUSCOS';

/** Fuente de la whitelist (no CSS libre); el front la mapea a una webfont. */
export type FontChoice =
  | 'SYSTEM' | 'SERIF' | 'SANS' | 'SLAB' | 'DISPLAY' | 'HANDWRITTEN' | 'MONO';

export type MenuLayout = 'LIST' | 'CARDS' | 'COLUMNS';

export interface PricedPortion {
  label:  string;     // "Tapa", "Media", "Ración"
  amount: number;
}

export interface MenuCategory {
  id:           string;
  name:         string;
  slug:         string;
  description?: string;
  icon:         CategoryIcon;
  sortOrder:    number;
  active:       boolean;
}

export interface MenuItem {
  id:           string;
  name:         string;
  description?: string;
  price?:       number;        // base/única ración; null si solo hay raciones
  portions:     PricedPortion[];
  allergens:    Allergen[];
  vegan:        boolean;
  vegetarian:   boolean;
  glutenFree:   boolean;
  spicy:        boolean;
  badge?:       string;
  available:    boolean;
  sortOrder:    number;
  categoryId:   string;
  categoryName: string;
}

export interface MenuPresentation {
  headingFont:   FontChoice;
  bodyFont:      FontChoice;
  accentColor:   string;       // #RRGGBB
  layout:        MenuLayout;
  showPrices:    boolean;
  showAllergens: boolean;
  currency:      string;       // ISO 4217
}

/* ── Carta pública (agregado para pintar de una sola llamada) ── */

export interface CartaCategory {
  id:           string;
  name:         string;
  slug:         string;
  description?: string;
  icon:         CategoryIcon;
  items:        MenuItem[];
}

export interface Carta {
  categories:   CartaCategory[];
  presentation: MenuPresentation;
}

/* ── Menú del día ── */

export interface DailyMenuOption {
  id:           string;
  itemId?:      string;        // null = línea libre
  name:         string;        // efectivo (del plato si itemId)
  description?: string;
  supplement?:  number;
  allergens:    Allergen[];
}

export interface DailyMenuCourse {
  id:      string;
  name:    string;             // "Primeros", "Postres"
  choose:  number;             // nº de opciones que elige el comensal
  options: DailyMenuOption[];
}

export interface DailyMenu {
  id:           string;
  date:         string;        // ISO 'YYYY-MM-DD'
  name:         string;
  price:        number;
  description?: string;
  published:    boolean;
  publishedAt?: string;
  courses:      DailyMenuCourse[];
}

/* ── Requests (admin) ── */

export interface CreateMenuCategoryRequest {
  name:         string;
  description?: string;
  icon?:        CategoryIcon;
  sortOrder:    number;
}

export interface CreateMenuItemRequest {
  name:         string;
  description?: string;
  price?:       number;
  portions?:    PricedPortion[];
  allergens?:   Allergen[];
  vegan:        boolean;
  vegetarian:   boolean;
  glutenFree:   boolean;
  spicy:        boolean;
  badge?:       string;
  sortOrder:    number;
  categoryId:   string;
}

export interface SaveDailyMenuOption {
  itemId?:      string;
  name?:        string;
  description?: string;
  supplement?:  number;
  allergens?:   Allergen[];
}

export interface SaveDailyMenuCourse {
  name:    string;
  choose:  number;
  options: SaveDailyMenuOption[];
}

export interface SaveDailyMenuRequest {
  date:         string;
  name:         string;
  price:        number;
  description?: string;
  courses:      SaveDailyMenuCourse[];
}
