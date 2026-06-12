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
}
