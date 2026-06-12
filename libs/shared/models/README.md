# @adrianmartincano/ng-models

Interfaces y tipos TypeScript compartidos por todas las librerías `@adrianmartincano/ng-*`. No contiene componentes ni lógica — solo definiciones de datos, así que es ligerísima y no añade peso al bundle.

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-models
```

Sin peer dependencies — funciona en cualquier proyecto TypeScript.

---

## Uso

Importa los tipos que necesites en cualquier fichero:

```typescript
import { Product, NavItem, FormField, CartItem } from '@adrianmartincano/ng-models';

const item: NavItem = { label: 'Tienda', path: '/tienda' };
```

---

## Modelos por dominio

### UI (`lib-navbar`, `lib-footer`, `lib-table`, `lib-button`...)

| Tipo | Para qué sirve |
|---|---|
| `NavItem` | Enlaces de navegación de la navbar (con `children` para submenús). |
| `FooterSection` / `FooterLink` | Columnas de enlaces del footer. |
| `SocialLink` / `SocialPlatform` | Iconos de redes sociales (`platform` + `url`). |
| `Language` | Idiomas del selector de la navbar (`code`, `label`, `flag`). |
| `Column` | Definición de columnas de `lib-table`. |
| `ButtonVariant` / `ButtonSize` | Variantes y tamaños de `lib-button`. |

### Formularios (`@adrianmartincano/ng-forms`)

| Tipo | Para qué sirve |
|---|---|
| `FormField` | Definición de un campo del formulario dinámico (tipo, label, validación...). |
| `FormFieldType` | Tipos de input disponibles: `text`, `email`, `select`, `textarea`... |
| `SelectOption` | Opciones de campos `select` y `radio`. |

### Autenticación (`@adrianmartincano/ng-auth`)

| Tipo | Para qué sirve |
|---|---|
| `AuthUser` | Usuario autenticado (id, nombre, email, roles). |
| `LoginCredentials` / `RegisterCredentials` | Datos de login y registro. |
| `AuthResponse` | Respuesta del backend (token + usuario). |
| `AuthConfig` | Configuración del `AuthService` (endpoints). |
| `SocialProvider` | Proveedor de login social (Google, GitHub...). |

### Productos y ecommerce (`@adrianmartincano/ng-products`, `@adrianmartincano/ng-ecommerce`)

| Tipo | Para qué sirve |
|---|---|
| `Product` / `ProductCategory` | Producto del catálogo y sus categorías. |
| `ProductFilter` / `ProductSortBy` | Filtros y ordenación del grid. |
| `CartItem` | Línea del carrito (producto + cantidad). |
| `Order` / `OrderRequest` / `OrderStatus` | Pedido, petición de compra y estados. |
| `ShippingAddress` / `PaymentMethod` / `CheckoutStep` | Datos del checkout. |

### Upload (`@adrianmartincano/ng-upload`)

| Tipo | Para qué sirve |
|---|---|
| `UploadedFile` | Archivo subido (nombre, tamaño, URL, preview). |
| `UploadError` | Error de validación (tipo o tamaño no permitido). |

### CMS (`@adrianmartincano/ng-cms`)

| Tipo | Para qué sirve |
|---|---|
| `CmsPage` / `CmsBlock` / `CmsBlockType` | Página y bloques de contenido. |
| `HeroData`, `TextData`, `TextImageData`, `GalleryData`, `FaqData`, `PricingData`, `CtaBannerData`, `FeaturesData`, `TestimonialsData`, `CountersData`, `TrustBadgesData`, `NewsletterBlockData` | Datos de cada tipo de bloque. |
| `GalleryImage`, `FaqItem`, `PricingPlan`, `FeatureItem`, `TestimonialItem`, `CounterItem`, `TrustBadgeItem`, `CmsCta` | Elementos individuales dentro de los bloques. |

### Reservas (`@adrianmartincano/ng-reservations`)

| Tipo | Para qué sirve |
|---|---|
| `BookingService` | Servicio reservable (duración, precio). |
| `TimeSlot` | Franja horaria disponible. |
| `Booking` / `BookingRequest` / `BookingStatus` / `BookingStep` | Reserva, petición y estados del flujo. |

### Genéricos de API

| Tipo | Para qué sirve |
|---|---|
| `ApiResponse<T>` | Envoltorio estándar de respuestas (`success`, `data`, `message`) — el mismo formato que devuelven los módulos Spring Boot `io.github.adrianmartincano:spring-*`. |
| `PaginatedResponse<T>` | Respuesta paginada (contenido + total + página). |
