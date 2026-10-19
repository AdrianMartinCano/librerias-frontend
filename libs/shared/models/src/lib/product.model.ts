export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;   // precio original para mostrar descuento
  category: string | ProductCategory;
  imageUrl: string;
  images?: string[];         // galería adicional
  inStock: boolean;
  rating: number;
  reviewCount: number;
  badge?: string;            // etiqueta: "Nuevo", "-20%", "Oferta"...
  slug?: string;             // para routing: /productos/mi-producto
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchTerm?: string;
}

export type ProductSortBy = 'name' | 'price-asc' | 'price-desc' | 'rating';

export interface CartItem {
  product:  Product;
  quantity: number;

  /**
   * Lo que el cliente ha elegido para ESTA línea: color, complemento, dedicatoria.
   *
   * La librería no sabe qué significan: solo los transporta hasta el checkout, que los
   * manda al backend en `opciones`. Cada tienda decide qué mete y qué es válido.
   *
   * OJO, DOS LÍNEAS CON EL MISMO PRODUCTO Y DISTINTAS OPCIONES SON DOS LÍNEAS. Un libro
   * firmado y uno sin firmar se preparan por separado, así que se cuentan por separado.
   * Ver `claveDeLinea` en CartService.
   *
   * Se omite cuando no hay ninguna, para que las tiendas que no las usan tengan el carrito
   * exactamente igual que antes.
   */
  options?: Record<string, string>;
}
