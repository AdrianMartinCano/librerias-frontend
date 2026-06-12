import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TableComponent, CardComponent, ButtonComponent, ToastService, SkeletonComponent, LoaderComponent, ModalComponent } from '@org/ui';
import { DynamicFormComponent } from '@org/forms';
import { LoginComponent, AuthService, GOOGLE, GITHUB, TWITTER, FACEBOOK } from '@org/auth';
import { UploadComponent } from '@org/upload';
import { ProductGridComponent, CartService } from '@org/products';
import { CartSummaryComponent, CheckoutComponent, OrderCardComponent } from '@org/ecommerce';
import { CmsPageComponent } from '@org/cms';
import { BookingFormComponent } from '@org/reservations';
import { CmsPage, BookingService as BookingServiceModel, TimeSlot } from '@org/models';
import { DEMO_PRODUCTS } from '../product-detail/product-detail.component';
import { Column, FormField, AuthResponse, SocialProvider, UploadError, Product } from '@org/models';

/* ── Validadores personalizados reutilizables ── */

function testValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = String(ctrl.value ?? '');
  if (!value) return null;

  const numeros = (value.match(/\d/g) ?? []).length;
  const letras  = (value.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) ?? []).length;
  const otros   = value.length - numeros - letras;

  if (otros > 0)    return { message: 'Solo se permiten letras y números' };
  if (numeros > 3)  return { message: `Máximo 3 números (tienes ${numeros})` };
  if (letras > 10)  return { message: `Máximo 10 letras (tienes ${letras})` };

  return null;
}


/* ── Datos de prueba ─────────────────────────── */
interface Pedido {
  id: number;
  cliente: string;
  producto: string;
  total: number;
  estado: string;
  fecha: string;
  pagado: boolean;
}

interface Material {
  material: string;
  cantidad: number;
  precio: number;
  disponible: boolean;
}

const CMS_LANDING_FALLBACK: CmsPage = {
  slug: 'home',
  title: 'Demo landing — tienda de ejemplo',
  blocks: [
    { type: 'hero', data: { title: 'Moda sostenible para el día a día', subtitle: 'Prendas de calidad, fabricadas con materiales naturales y procesos responsables.', image: 'https://picsum.photos/seed/moda/1600/700', overlay: true, align: 'center', cta: { label: 'Ver colección', href: '/demo' }, ctaSecondary: { label: 'Nuestra historia', href: '/demo' } } },
    { type: 'features', data: { title: '¿Por qué elegirnos?', subtitle: 'Comprometidos con la calidad y el medio ambiente', cols: 3, items: [{ icon: '🌿', title: 'Materiales naturales', text: 'Algodón orgánico, lino y lana certificados sin pesticidas ni químicos.' }, { icon: '♻️', title: 'Producción responsable', text: 'Fabricamos en pequeños talleres locales con condiciones laborales justas.' }, { icon: '📦', title: 'Envío gratis', text: 'Envío gratuito a partir de 50€ en toda España y Portugal.' }] } },
    { type: 'text-image', data: { title: 'Nuestro compromiso contigo', text: 'Fundada en 2018, nacimos con la misión de demostrar que la moda puede ser bonita y responsable.\n\nCada prenda está pensada para durar años, no temporadas. Creemos en la transparencia total.', image: 'https://picsum.photos/seed/taller/800/600', imagePosition: 'right', cta: { label: 'Leer más', href: '/demo' } } },
    { type: 'testimonials', data: { title: 'Lo que dicen nuestros clientes', items: [{ text: 'La calidad es increíble. Llevo 2 años comprando aquí y mis prendas siguen perfectas.', author: 'María García', role: 'Cliente desde 2022', rating: 5 }, { text: 'El algodón orgánico es suavísimo y se nota que está bien hecho. Volveré a pedir seguro.', author: 'Carlos Ruiz', role: 'Primera compra', rating: 5 }, { text: 'Me encanta saber de dónde viene lo que compro. Eso marca la diferencia.', author: 'Laura Martínez', role: 'Cliente habitual', rating: 5 }] } },
    { type: 'gallery', data: { title: 'Nuestra colección', cols: 4, images: [{ src: 'https://picsum.photos/seed/ropa1/400/400', alt: 'Camiseta algodón' }, { src: 'https://picsum.photos/seed/ropa2/400/400', alt: 'Pantalón lino' }, { src: 'https://picsum.photos/seed/ropa3/400/400', alt: 'Vestido verano' }, { src: 'https://picsum.photos/seed/ropa4/400/400', alt: 'Chaqueta punto' }, { src: 'https://picsum.photos/seed/ropa5/400/400', alt: 'Bolso natural' }, { src: 'https://picsum.photos/seed/ropa6/400/400', alt: 'Zapatillas lona' }, { src: 'https://picsum.photos/seed/ropa7/400/400', alt: 'Pañuelo seda' }, { src: 'https://picsum.photos/seed/ropa8/400/400', alt: 'Calcetines lana' }] } },
    { type: 'pricing', data: { title: 'Hazte socio', subtitle: 'Acceso anticipado y descuentos exclusivos', plans: [{ name: 'Básico', price: 0, period: 'mes', features: ['Newsletter mensual', 'Acceso a rebajas', 'Envío gratis +70€'], cta: { label: 'Empezar gratis', href: '/demo' } }, { name: 'Premium', price: 9, period: 'mes', features: ['Todo lo anterior', 'Acceso anticipado', 'Envío gratis siempre', 'Descuento 10%'], cta: { label: 'Hacerse premium', href: '/demo' }, highlighted: true, badge: 'Más popular' }, { name: 'Anual', price: 79, period: 'año', features: ['Todo Premium', '2 meses gratis', 'Descuento 15%', 'Invitaciones a eventos'], cta: { label: 'Suscribirse', href: '/demo' } }] } },
    { type: 'faq', data: { title: 'Preguntas frecuentes', items: [{ question: '¿Cuánto tarda el envío?', answer: 'Los pedidos nacionales se entregan en 2-3 días laborables. Envío exprés en 24h disponible.' }, { question: '¿Puedo devolver mi compra?', answer: 'Sí, tienes 30 días para devolver cualquier artículo en perfecto estado. La devolución es gratuita.' }, { question: '¿Los materiales son realmente orgánicos?', answer: 'Todos nuestros tejidos tienen certificación GOTS verificable.' }, { question: '¿Tienen tienda física?', answer: 'Sí, en Madrid (Malasaña) y Barcelona (Gràcia). También en tiendas multimarca seleccionadas.' }] } },
    { type: 'cta-banner', data: { title: '¿Lista para tu primer pedido?', subtitle: 'Envío gratis en tu primera compra con el código BIENVENIDA', background: 'accent', cta: { label: 'Comprar ahora', href: '/demo' }, ctaSecondary: { label: 'Ver catálogo completo', href: '/demo' } } },
  ],
};

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [TableComponent, CardComponent, ButtonComponent, CurrencyPipe, JsonPipe, DynamicFormComponent, LoginComponent, UploadComponent, ProductGridComponent, CartSummaryComponent, CheckoutComponent, OrderCardComponent, CmsPageComponent, BookingFormComponent, SkeletonComponent, LoaderComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo">

      <!-- ── Hero ── -->
      <section class="demo-hero">
        <div class="container">
          <span class="demo-hero__tag">LibUI · Design System</span>
          <h1 class="demo-hero__title">Componentes reutilizables</h1>
          <p class="demo-hero__desc">
            Mobile-first · Temable con CSS variables · Angular 21 signals
          </p>
          <div class="demo-hero__actions">
            <lib-button variant="accent" size="lg">Ver código</lib-button>
            <lib-button variant="outline" size="lg">Documentación</lib-button>
          </div>
        </div>
      </section>

      <!-- ── Tabla auto-columnas ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Tabla — columnas automáticas</h2>
            <p class="demo-section__desc">
              Con <code>[data]="pedidos"</code> sin definir <code>[columns]</code>,
              la tabla infiere los nombres desde las claves del objeto.
            </p>
            <div class="demo-code">
              <code>&lt;lib-table [data]="pedidos" /&gt;</code>
            </div>
          </div>
          <lib-table [data]="pedidosSimples" />
        </div>
      </section>

      <!-- ── Tabla columnas explícitas ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Tabla — columnas explícitas</h2>
            <p class="demo-section__desc">
              Con <code>[columns]</code> controlas etiqueta, tipo de dato, alineación y formato.
              Prueba a ordenar haciendo clic en las cabeceras.
            </p>
            <div class="demo-code">
              <code>&lt;lib-table [data]="materiales" [columns]="columnasMateriales" [striped]="true" /&gt;</code>
            </div>
          </div>
          <lib-table
            [data]="materiales"
            [columns]="columnasMateriales"
            [striped]="true"
          />
        </div>
      </section>

      <!-- ── Tabla con badges ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Tabla — con badges de estado</h2>
            <p class="demo-section__desc">
              El tipo <code>badge</code> con <code>badgeMap</code> colorea cada valor automáticamente.
            </p>
          </div>
          <lib-table
            [data]="pedidos"
            [columns]="columnasPedidos"
          />
        </div>
      </section>

      <!-- ── Cards ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Cards</h2>
            <p class="demo-section__desc">
              Grid responsive: 1 columna en móvil, 2 en tablet, 3 en desktop.
            </p>
          </div>
          <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
            @for (p of productos; track p.id) {
              <lib-card
                [title]="p.titulo"
                [subtitle]="p.subtitulo"
                [image]="p.imagen"
                [badge]="p.badge"
                [routerLink]="'/demo'"
              >
                <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                  {{ p.descripcion }}
                </p>
                <div style="margin-top: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: var(--font-size-xl); color: var(--color-text);">
                    {{ p.precio | currency:'EUR':'symbol':'1.2-2':'es' }}
                  </strong>
                  <lib-button variant="accent" size="sm">Añadir</lib-button>
                </div>
              </lib-card>
            }
          </div>
        </div>
      </section>

      <!-- ── Botones ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Botones</h2>
            <p class="demo-section__desc">Todas las variantes y tamaños.</p>
          </div>

          <div class="demo-buttons-grid">
            <!-- Variantes -->
            <div class="demo-buttons-group">
              <h4>Variantes</h4>
              <div class="demo-buttons-row">
                <lib-button variant="primary">Primary</lib-button>
                <lib-button variant="accent">Accent</lib-button>
                <lib-button variant="secondary">Secondary</lib-button>
                <lib-button variant="outline">Outline</lib-button>
                <lib-button variant="ghost">Ghost</lib-button>
                <lib-button variant="danger">Danger</lib-button>
              </div>
            </div>

            <!-- Tamaños -->
            <div class="demo-buttons-group">
              <h4>Tamaños</h4>
              <div class="demo-buttons-row demo-buttons-row--center">
                <lib-button variant="accent" size="sm">Pequeño</lib-button>
                <lib-button variant="accent" size="md">Mediano</lib-button>
                <lib-button variant="accent" size="lg">Grande</lib-button>
              </div>
            </div>

            <!-- Estados -->
            <div class="demo-buttons-group">
              <h4>Estados</h4>
              <div class="demo-buttons-row">
                <lib-button variant="primary" [loading]="true">Cargando</lib-button>
                <lib-button variant="primary" [disabled]="true">Deshabilitado</lib-button>
                <lib-button variant="accent" [full]="true">Ancho completo</lib-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Formularios ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Formularios dinámicos</h2>
            <p class="demo-section__desc">
              Define los campos con un array y el formulario se genera solo.
              Incluye validación, mensajes de error y estados de carga.
            </p>
            <div class="demo-code">
              <code>&lt;lib-form [fields]="campos" (submitted)="onSubmit($event)" /&gt;</code>
            </div>
          </div>

          <div class="grid grid-cols-1 grid-cols-lg-2 gap-8">
            <!-- Formulario de contacto -->
            <div class="demo-form-card">
              <h3 class="demo-form-card__title">Formulario de contacto</h3>
              <lib-form
                [fields]="camposContacto"
                submitLabel="Enviar mensaje"
                cancelLabel="Cancelar"
                (submitted)="onFormSubmit($event)"
                (cancelled)="onFormCancel()"
              />
            </div>

            <!-- Formulario de reserva (2 columnas) -->
            <div class="demo-form-card">
              <h3 class="demo-form-card__title">Reserva de cita (2 columnas)</h3>
              <lib-form
                [fields]="camposReserva"
                [cols]="2"
                submitLabel="Reservar cita"
                [loading]="formLoading"
                (submitted)="onReservaSubmit($event)"
              />
            </div>
          </div>

          @if (ultimoEnvio) {
            <div class="demo-form-result">
              <strong>Último envío:</strong>
              <pre>{{ ultimoEnvio | json }}</pre>
            </div>
          }
        </div>
      </section>

      <!-- ── Productos ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Catálogo de productos</h2>
            <p class="demo-section__desc">
              Grid responsive con búsqueda, filtro por categoría, ordenación y estado vacío.
              La librería incluye <code>lib-product-card</code> (individual) y
              <code>lib-product-grid</code> (con filtros).
            </p>
          </div>
          <lib-product-grid
            [products]="catalogoProductos"
            [cols]="3"
            [showSearch]="true"
            [showFilters]="true"
            [showSort]="true"
            routePrefix="/demo/productos"
            (addToCart)="onAddToCart($event)"
          />
        </div>
      </section>

      <!-- ── Ecommerce ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Ecommerce — Carrito y Checkout</h2>
            <p class="demo-section__desc">
              Añade productos desde el catálogo de arriba y prueba el flujo completo:
              carrito → envío → pago → confirmación.
            </p>
          </div>

          <div class="grid grid-cols-1 grid-cols-lg-2 gap-8">
            <div>
              <h3 class="demo-ecom-title">Carrito actual</h3>
              <lib-cart-summary
                [items]="cartService.items()"
                [total]="cartService.total()"
                [showClearBtn]="true"
                (checkout)="mostrarCheckout.set(true)"
                (clearCart)="cartService.clear()"
                (itemChange)="cartService.updateQuantity($event.item.product.id, $event.quantity)"
                (itemRemove)="cartService.remove($event.product.id)"
              />
              @if (cartService.count() === 0) {
                <p class="demo-ecom-hint">↑ Añade productos desde el catálogo para ver el carrito en acción.</p>
              }
            </div>

            <div>
              @if (mostrarCheckout()) {
                <h3 class="demo-ecom-title">Proceso de compra</h3>
                <lib-checkout
                  successMessage="¡Perfecto! En un proyecto real aquí se haría la llamada al backend."
                  (orderPlaced)="onOrderPlaced($event)"
                  (cancelled)="mostrarCheckout.set(false)"
                />
              } @else {
                <h3 class="demo-ecom-title">Historial de pedidos</h3>
                <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                  @for (order of demoOrders; track order.id) {
                    <lib-order-card [order]="order" (viewDetail)="onVerPedido($event)" />
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ── Upload ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Upload — Subida de archivos</h2>
            <p class="demo-section__desc">
              Drag & drop, preview de imágenes, validación de tipo y tamaño.
            </p>
            <div class="demo-code"><code>&lt;lib-upload (filesSelected)="onFiles($event)" /&gt;</code></div>
          </div>

          <div class="grid grid-cols-1 grid-cols-md-2 gap-8">

            <!-- Imagen única -->
            <div>
              <p class="demo-upload-label">Imagen única (por defecto)</p>
              <lib-upload
                accept="image/*"
                label="Sube tu foto de perfil"
                sublabel="PNG, JPG o GIF · Máx. 2MB"
                [maxSizeMb]="2"
                [multiple]="false"
                (filesSelected)="onFilesSelected($event)"
                (uploadError)="onUploadError($event)"
              />
            </div>

            <!-- Múltiples archivos -->
            <div>
              <p class="demo-upload-label">Múltiples archivos (hasta 4)</p>
              <lib-upload
                accept="image/*,.pdf"
                label="Arrastra tus documentos"
                [multiple]="true"
                [maxFiles]="4"
                [maxSizeMb]="10"
                (filesSelected)="onFilesSelected($event)"
                (uploadError)="onUploadError($event)"
              />
            </div>

            <!-- Con progreso simulado -->
            <div>
              <p class="demo-upload-label">Con barra de progreso</p>
              <lib-upload
                accept="image/*"
                label="Subida con progreso"
                [progress]="uploadProgress()"
                (filesSelected)="simularSubida($event)"
                (fileRemoved)="resetProgress()"
                (uploadError)="onUploadError($event)"
              />
              <lib-button variant="secondary" size="sm" (clicked)="resetProgress()" style="margin-top:8px">
                Reiniciar progreso
              </lib-button>
            </div>

            <!-- Estado y eventos -->
            <div class="auth-panel">
              <h3 class="auth-panel__title">Eventos recibidos</h3>
              @if (uploadedFiles().length > 0) {
                <div class="auth-panel__user">
                  <p><strong>Archivos seleccionados:</strong> {{ uploadedFiles().length }}</p>
                  @for (f of uploadedFiles(); track f.name) {
                    <p>• {{ f.name }} ({{ formatFileSize(f.size) }})</p>
                  }
                </div>
              }
              @if (lastUploadError()) {
                <div class="auth-panel__event">
                  <p class="auth-panel__event-label">Error</p>
                  <pre>{{ lastUploadError() | json }}</pre>
                </div>
              }
              @if (uploadedFiles().length === 0 && !lastUploadError()) {
                <p style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
                  Sube algún archivo para ver los eventos aquí.
                </p>
              }
            </div>

          </div>
        </div>
      </section>

      <!-- ── Auth ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Auth — Login / Registro</h2>
            <p class="demo-section__desc">
              Componente <code>&lt;lib-login&gt;</code> con login, registro y proveedores sociales.
              Sin backend real: usa los botones del panel derecho para simular estados.
            </p>
          </div>

          <div class="grid grid-cols-1 grid-cols-lg-3 gap-8">

            <!-- showSocialText=true (con texto) -->
            <lib-login
              title="Con texto"
              logoText="LibUI"
              forgotPasswordUrl="#"
              [socialProviders]="socialProviders"
              [showSocialText]="true"
              (loginSuccess)="onAuthSuccess($event)"
              (loginError)="onAuthError($event)"
              (socialClick)="onSocialClick($event)"
            />

            <!-- showSocialText=false (solo iconos circulares) -->
            <lib-login
              title="Solo iconos"
              logoText="LibUI"
              forgotPasswordUrl="#"
              [socialProviders]="socialProviders"
              [showSocialText]="false"
              (loginSuccess)="onAuthSuccess($event)"
              (loginError)="onAuthError($event)"
              (socialClick)="onSocialClick($event)"
            />

            <!-- Panel de estado y simulación -->
            <div class="auth-panel">
              <h3 class="auth-panel__title">Estado de la sesión</h3>

              <div class="auth-panel__state" [class.auth-panel__state--active]="auth.isLoggedIn()">
                <span class="auth-panel__dot"></span>
                {{ auth.isLoggedIn() ? 'Autenticado' : 'No autenticado' }}
              </div>

              @if (auth.currentUser()) {
                <div class="auth-panel__user">
                  <p><strong>Nombre:</strong> {{ auth.currentUser()?.name }}</p>
                  <p><strong>Email:</strong> {{ auth.currentUser()?.email }}</p>
                  <p><strong>Roles:</strong> {{ auth.currentUser()?.roles?.join(', ') }}</p>
                  <p><strong>Token:</strong> <code class="auth-panel__token">{{ auth.token()?.slice(0, 30) }}...</code></p>
                </div>
              }

              <div class="auth-panel__actions">
                <lib-button variant="accent" [full]="true" (clicked)="simularLogin()">
                  Simular login exitoso
                </lib-button>
                <lib-button variant="secondary" [full]="true" (clicked)="simularAdmin()">
                  Simular login como admin
                </lib-button>
                @if (auth.isLoggedIn()) {
                  <lib-button variant="danger" [full]="true" (clicked)="auth.logout()">
                    Logout
                  </lib-button>
                }
              </div>

              @if (ultimoEventoAuth) {
                <div class="auth-panel__event">
                  <p class="auth-panel__event-label">Último evento:</p>
                  <pre>{{ ultimoEventoAuth | json }}</pre>
                </div>
              }
            </div>

          </div>
        </div>
      </section>

      <!-- ── Reservations ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Reservations — Sistema de reservas</h2>
            <p class="demo-section__desc">
              Selecciona servicio → fecha → hora → datos → confirmación.
              Los datos de disponibilidad los provee el backend; aquí usamos datos de demo.
            </p>
          </div>
          <div style="max-width:640px; margin-inline:auto">
            <lib-booking-form
              [servicios]="bookingServicios"
              [disponibilidad]="bookingDisponibilidad"
              [slots]="bookingSlots"
              mensajeExito="¡Genial! Te hemos enviado un email de confirmación. Nos vemos pronto."
              (servicioSeleccionado)="onServicioSeleccionado($event)"
              (fechaSeleccionada)="onFechaSeleccionada($event)"
              (reservaConfirmada)="onReservaConfirmada($event)"
            />
          </div>
        </div>
      </section>

      <!-- ── CMS ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">CMS — Constructor de páginas</h2>
            <p class="demo-section__desc">
              Define una página como un array de bloques JSON y <code>&lt;lib-cms-page&gt;</code>
              la renderiza entera. El cliente edita los datos, tú nunca tocas el HTML.
            </p>
            <div class="demo-code"><code>&lt;lib-cms-page [page]="miPagina" /&gt;</code></div>
          </div>
        </div>

        <!-- JSON recibido del backend: útil para depurar la estructura de bloques -->
        <div class="container" style="margin-bottom:1rem">
          <details>
            <summary style="cursor:pointer;font-size:.75rem;color:var(--color-text-muted)">Ver JSON de la página</summary>
            <pre style="font-size:.7rem;overflow:auto;max-height:200px;background:var(--color-surface);padding:var(--space-3);border-radius:var(--radius-md)">{{ cmsLanding() | json }}</pre>
          </details>
        </div>

        <!-- La página de ejemplo se renderiza fuera del container para ocupar todo el ancho -->
        <lib-cms-page [page]="cmsLanding()" />
      </section>

      <!-- ── Toasts / Modal / Skeleton / Loader ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Toasts, Modal, Skeleton y Loader</h2>
            <p class="demo-section__desc">Componentes de feedback e interfaz que faltaban.</p>
          </div>

          <div class="grid grid-cols-1 grid-cols-md-2 gap-8">

            <!-- Toasts -->
            <div>
              <h3 class="demo-ecom-title">Toasts — notificaciones</h3>
              <p class="demo-section__desc">
                Añade <code>&lt;lib-toast-container /&gt;</code> una vez en <code>app.html</code>.
                Luego usa <code>inject(ToastService)</code> en cualquier componente.
              </p>
              <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
                <lib-button variant="accent" size="sm" (clicked)="toast.success('Producto añadido al carrito')">✓ Success</lib-button>
                <lib-button variant="danger" size="sm" (clicked)="toast.error('Error al procesar el pago', { title: 'Pago fallido' })">✕ Error</lib-button>
                <lib-button variant="secondary" size="sm" (clicked)="toast.warning('El stock es limitado')">⚠ Warning</lib-button>
                <lib-button variant="outline" size="sm" (clicked)="toast.info('Tu reserva expira en 10 min')">ℹ Info</lib-button>
                <lib-button variant="ghost" size="sm" (clicked)="toast.success('Acción completada', { action: { label: 'Deshacer', fn: () => toast.info('Deshecho') } })">Con acción</lib-button>
              </div>
            </div>

            <!-- Modal -->
            <div>
              <h3 class="demo-ecom-title">Modal — diálogo</h3>
              <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                <lib-button variant="secondary" size="sm" (clicked)="modalAbierto.set(true)">Abrir modal</lib-button>
                <lib-button variant="outline" size="sm" (clicked)="modalConfirm.set(true)">Modal confirmación</lib-button>
              </div>

              <lib-modal [open]="modalAbierto()" title="Modal de ejemplo" (closed)="modalAbierto.set(false)">
                <p>Este es el cuerpo del modal. Puedes poner cualquier contenido aquí: formularios, imágenes, tablas...</p>
                <p style="margin-top:var(--space-3);color:var(--color-text-muted)">En móvil aparece desde abajo como un bottom sheet.</p>
                <div slot="footer">
                  <lib-button variant="secondary" (clicked)="modalAbierto.set(false)">Cancelar</lib-button>
                  <lib-button variant="accent" (clicked)="modalAbierto.set(false)">Aceptar</lib-button>
                </div>
              </lib-modal>

              <lib-modal [open]="modalConfirm()" title="¿Eliminar producto?" size="sm" (closed)="modalConfirm.set(false)">
                <p>Esta acción no se puede deshacer. ¿Estás seguro?</p>
                <div slot="footer">
                  <lib-button variant="ghost" (clicked)="modalConfirm.set(false)">Cancelar</lib-button>
                  <lib-button variant="danger" (clicked)="onConfirmDelete()">Eliminar</lib-button>
                </div>
              </lib-modal>
            </div>

            <!-- Skeleton -->
            <div>
              <h3 class="demo-ecom-title">Skeleton — placeholder de carga</h3>
              <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                <div>
                  <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:8px">type="card"</p>
                  <lib-skeleton type="card" />
                </div>
                <div>
                  <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:8px">type="text" lines="3"</p>
                  <lib-skeleton type="text" [lines]="3" />
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <lib-skeleton type="avatar" width="48px" height="48px" />
                  <div style="flex:1"><lib-skeleton type="title" /><lib-skeleton type="text" [lines]="1" /></div>
                </div>
              </div>
            </div>

            <!-- Loader -->
            <div>
              <h3 class="demo-ecom-title">Loader — overlay de carga</h3>
              <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4)">
                <lib-button variant="secondary" size="sm" (clicked)="simularCarga()">Simular carga</lib-button>
              </div>
              <lib-loader [loading]="loaderActivo()" message="Guardando cambios...">
                <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:var(--space-6);text-align:center">
                  <p>Contenido que se carga</p>
                  <p style="font-size:var(--font-size-sm);color:var(--color-text-muted)">El spinner aparece encima durante la carga.</p>
                </div>
              </lib-loader>
            </div>

          </div>
        </div>
      </section>

      <!-- ── Animaciones ── -->
      <section class="demo-section">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Animaciones</h2>
            <p class="demo-section__desc">
              Clases CSS del theme. Se activan añadiendo la clase al elemento.
              Para reiniciarlas en la demo pulsa el botón.
            </p>
          </div>

          <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:var(--space-3)">
            Las de abajo se ejecutan una vez al aparecer. Las de la derecha son continuas.
          </p>

          @if (animPlay()) {
            <div class="grid grid-cols-2 grid-cols-md-4 gap-4" style="margin-bottom: var(--space-4)">
              @for (anim of animaciones; track anim.clase) {
                <div class="demo-anim-box {{ anim.clase }}">
                  <code>.{{ anim.clase }}</code>
                  <span>{{ anim.desc }}</span>
                </div>
              }
            </div>
          }

          <lib-button variant="secondary" (clicked)="reiniciarAnimaciones()">
            Reiniciar animaciones
          </lib-button>
        </div>
      </section>

      <!-- ── Sistema de paletas ── -->
      <section class="demo-section demo-section--alt">
        <div class="container">
          <div class="demo-section__header">
            <h2 class="demo-section__title">Sistema de colores — dos opciones</h2>
            <p class="demo-section__desc">
              <strong>Opción A · Paleta de 4 colores</strong> — define <code>--p1..p4</code> y todo se deriva automáticamente.<br>
              <strong>Opción B · Variables individuales</strong> — sobreescribe solo lo que necesites.<br>
              Puedes mezclar ambas. La variable directa siempre gana sobre la paleta.
            </p>
            <div class="demo-code"><code>--p1: #0c4a6e; --p2: #0ea5e9; --p3: #bae6fd; --p4: #f0f9ff;</code></div>
          </div>

          <!-- Opción A: paletas completas -->
          <p class="demo-option-label">Opción A — paleta de 4 colores</p>
          <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6" style="margin-bottom: var(--space-8)">
            @for (paleta of paletas; track paleta.nombre) {
              <div class="demo-palette-card" [style]="paleta.vars">
                <!-- Navbar mini -->
                <div class="demo-palette-nav">
                  <span class="demo-palette-logo">MiApp</span>
                  <span class="demo-palette-navlink">Inicio</span>
                  <span class="demo-palette-navlink demo-palette-navlink--active">Productos</span>
                </div>
                <!-- Contenido -->
                <div class="demo-palette-body">
                  <p class="demo-palette-name">{{ paleta.nombre }}</p>
                  <div class="demo-palette-buttons">
                    <span class="demo-palette-btn demo-palette-btn--primary">Primary</span>
                    <span class="demo-palette-btn demo-palette-btn--accent">Accent</span>
                    <span class="demo-palette-btn demo-palette-btn--outline">Outline</span>
                  </div>
                  <div class="demo-palette-input-row">
                    <span class="demo-palette-input">Formulario</span>
                    <span class="demo-palette-badge">Nuevo</span>
                  </div>
                  <div class="demo-palette-progress">
                    <div class="demo-palette-bar"></div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Opción B: variables individuales -->
          <p class="demo-option-label" style="margin-top:var(--space-8)">Opción B — variables individuales (sobreescribe solo lo que necesites)</p>
          <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
            @for (override of overrides; track override.nombre) {
              <div class="demo-palette-card">
                <div class="demo-palette-nav" [style]="'background:' + override.primary">
                  <span class="demo-palette-logo">MiApp</span>
                  <span class="demo-palette-navlink">Inicio</span>
                  <span class="demo-palette-navlink" [style]="'color:' + override.accent">Activo</span>
                </div>
                <div class="demo-palette-body">
                  <p class="demo-palette-name">{{ override.nombre }}</p>
                  <p class="demo-palette-desc">{{ override.codigo }}</p>
                  <div class="demo-palette-buttons">
                    <span class="demo-palette-btn" [style]="'background:' + override.primary + ';color:#fff'">Primary</span>
                    <span class="demo-palette-btn" [style]="'background:' + override.accent + ';color:#fff'">Accent</span>
                    <span class="demo-palette-btn" [style]="'border:1.5px solid ' + override.accent + ';color:' + override.accent">Outline</span>
                  </div>
                  <div class="demo-palette-progress">
                    <div class="demo-palette-bar" [style]="'background:' + override.accent"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .demo { padding-bottom: var(--space-16, 4rem); }

    /* ── Hero ── */
    .demo-hero {
      background: var(--color-primary, #1e1e1e);
      color: var(--color-text-inverse, #fff);
      padding: var(--space-16, 4rem) 0;
      text-align: center;
    }

    .demo-hero__tag {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: var(--radius-full, 9999px);
      padding: var(--space-1, 0.25rem) var(--space-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      margin-bottom: var(--space-4, 1rem);
      letter-spacing: 0.06em;
    }

    .demo-hero__title {
      font-size: var(--font-size-3xl, 1.875rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-inverse, #fff);
      margin-bottom: var(--space-4, 1rem);
    }

    .demo-hero__desc {
      color: rgba(255,255,255,0.65);
      font-size: var(--font-size-lg, 1.125rem);
      margin-bottom: var(--space-8, 2rem);
    }

    .demo-hero__actions {
      display: flex;
      gap: var(--space-4, 1rem);
      justify-content: center;
      flex-wrap: wrap;
    }

    @media (min-width: 768px) {
      .demo-hero__title { font-size: var(--font-size-4xl, 2.25rem); }
    }

    /* ── Secciones ── */
    .demo-section {
      padding: var(--space-12, 3rem) 0;
      background: var(--color-background, #fff);
    }

    .demo-section--alt {
      background: var(--color-surface, #f8f9fa);
    }

    .demo-section__header {
      margin-bottom: var(--space-8, 2rem);
    }

    .demo-section__title {
      font-size: var(--font-size-2xl, 1.5rem);
      margin-bottom: var(--space-2, 0.5rem);
      color: var(--color-text, #1e1e1e);
    }

    .demo-section__desc {
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-3, 0.75rem);
    }

    /* ── Code inline ── */
    .demo-code {
      display: inline-block;
      background: var(--color-primary, #1e1e1e);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    }

    .demo-code code {
      /* transparent para no solapar con el fondo oscuro del contenedor */
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: #a8e6cf;
      font-size: var(--font-size-sm, 0.875rem);
      font-family: 'Fira Code', 'Consolas', monospace;
    }

    code {
      background: var(--color-surface-alt, #f1f3f5);
      border-radius: var(--radius-sm, 0.25rem);
      padding: 2px var(--space-2, 0.5rem);
      font-size: 0.9em;
      font-family: 'Fira Code', 'Consolas', monospace;
      color: var(--color-accent, #ff4d4d);
    }

    /* ── Botones demo ── */
    .demo-buttons-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-8, 2rem);
    }

    .demo-buttons-group h4 {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-secondary, #666);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-3, 0.75rem);
    }

    .demo-buttons-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3, 0.75rem);
      align-items: flex-start;
    }

    .demo-buttons-row--center { align-items: center; }

    /* ── Upload ── */
    .demo-upload-label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-3, 0.75rem);
    }

    /* ── Animaciones ── */
    .demo-anim-box {
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-6, 1.5rem) var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      text-align: center;
      /* Más lentas en la demo para que se vean bien (en producción son 300ms) */
      --transition-slow: 900ms;
    }

    .demo-anim-box code {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-accent, #ff4d4d);
      background: color-mix(in srgb, var(--color-accent, #ff4d4d) 10%, transparent);
      padding: 2px var(--space-2, 0.5rem);
      border-radius: var(--radius-sm, 0.25rem);
    }

    .demo-anim-box span {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-secondary, #666);
    }

    /* ── Ecommerce ── */
    .demo-ecom-title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1a1a1a);
      margin: 0 0 var(--space-4, 1rem);
      padding-bottom: var(--space-3, .75rem);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
    }

    .demo-ecom-hint {
      font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-muted, #909090);
      margin-top: var(--space-4, 1rem);
      text-align: center;
    }

    /* ── Auth panel ── */
    .auth-panel {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-6, 1.5rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .auth-panel__title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1e1e1e);
      padding-bottom: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      margin: 0;
    }

    .auth-panel__state {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-muted, #999);
      padding: var(--space-3, 0.75rem);
      background: var(--color-surface, #f8f9fa);
      border-radius: var(--radius-md, 0.5rem);
    }

    .auth-panel__state--active { color: var(--color-success, #28a745); }

    .auth-panel__dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--color-text-muted, #999);
      flex-shrink: 0;
    }

    .auth-panel__state--active .auth-panel__dot { background: var(--color-success, #28a745); }

    .auth-panel__user {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 0.25rem);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text, #1e1e1e);
      padding: var(--space-3, 0.75rem);
      background: color-mix(in srgb, var(--color-success, #28a745) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-success, #28a745) 25%, transparent);
      border-radius: var(--radius-md, 0.5rem);
    }

    .auth-panel__token {
      font-family: monospace;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-secondary, #666);
    }

    .auth-panel__actions { display: flex; flex-direction: column; gap: var(--space-2, 0.5rem); }

    .auth-panel__event {
      background: var(--color-surface, #f8f9fa);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .auth-panel__event-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-secondary, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .auth-panel__event pre {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-secondary, #666);
      white-space: pre-wrap;
      margin: 0;
    }

    /* ── Formularios ── */
    .demo-form-card {
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-6, 1.5rem);
    }

    .demo-form-card__title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1e1e1e);
      margin-bottom: var(--space-6, 1.5rem);
      padding-bottom: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
    }

    .demo-form-result {
      margin-top: var(--space-6, 1.5rem);
      padding: var(--space-4, 1rem);
      background: var(--color-surface, #f8f9fa);
      border-radius: var(--radius-md, 0.5rem);
      border: 1px solid var(--color-border, #e0e0e0);
    }

    .demo-form-result pre {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      white-space: pre-wrap;
      margin-top: var(--space-2, 0.5rem);
    }

    .demo-option-label { font-size:var(--font-size-sm,.875rem); font-weight:600; color:var(--color-text-secondary,#666); margin-bottom:var(--space-4,1rem); text-transform:uppercase; letter-spacing:.05em; }

    /* ── Paletas (nuevo sistema de 4 colores) ── */
    .demo-palette-card {
      border-radius: var(--radius-lg, 0.75rem);
      overflow: hidden;
      border: 1px solid var(--p3, #e0e0e0);
      background: var(--p4, #f8f9fa);
    }

    /* Mini navbar */
    .demo-palette-nav {
      background: var(--p1);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .demo-palette-logo {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 700;
      color: #fff;
      margin-right: auto;
    }

    .demo-palette-navlink {
      font-size: var(--font-size-xs, 0.75rem);
      color: rgba(255,255,255,0.65);
    }

    .demo-palette-navlink--active {
      color: var(--p2);
      font-weight: 600;
    }

    /* Cuerpo */
    .demo-palette-body {
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .demo-palette-name { font-size:var(--font-size-xs,.75rem); font-weight:700; color:#1a1a1a; margin-bottom:var(--space-1,.25rem); }

    /* Botones mini */
    .demo-palette-buttons {
      display: flex;
      gap: var(--space-1, 0.25rem);
      flex-wrap: wrap;
    }

    .demo-palette-btn {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .demo-palette-btn--primary {
      background: var(--p1);
      color: #fff;
    }

    .demo-palette-btn--accent {
      background: var(--p2);
      color: #fff;
    }

    .demo-palette-btn--outline {
      border: 1.5px solid var(--p2);
      color: var(--p2);
      background: transparent;
    }

    /* Input + badge */
    .demo-palette-input-row {
      display: flex;
      gap: var(--space-2, 0.5rem);
      align-items: center;
    }

    .demo-palette-input {
      flex: 1;
      font-size: 10px;
      padding: 3px 6px;
      border: 1.5px solid var(--p3);
      border-radius: 4px;
      background: #fff;
      color: #1a1a1a;
    }

    .demo-palette-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 99px;
      background: var(--p2);
      color: #fff;
    }

    /* Progress bar */
    .demo-palette-progress {
      height: 5px;
      background: var(--p3);
      border-radius: 99px;
      overflow: hidden;
    }

    .demo-palette-bar {
      height: 100%;
      width: 65%;
      background: var(--p2);
      border-radius: 99px;
    }

    .demo-palette-desc { font-size:10px; color:var(--color-text-muted,#999); font-family:monospace; margin-bottom:var(--space-1,.25rem);
    }
  `],
})
export class DemoComponent {
  /* ── Tabla 1: auto-inferida ── */
  pedidosSimples: Record<string, unknown>[] = [
    { id: 1, nombre: 'María García', total: 125.5, estado: 'Enviado' },
    { id: 2, nombre: 'Juan López', total: 89.99, estado: 'Pendiente' },
    { id: 3, nombre: 'Ana Martínez', total: 245.0, estado: 'Entregado' },
    { id: 4, nombre: 'Carlos Ruiz', total: 58.0, estado: 'Cancelado' },
  ];

  /* ── Tabla 2: columnas explícitas ── */
  columnasMateriales: Column[] = [
    { key: 'material', label: 'Material' },
    { key: 'cantidad', label: 'Uds.', align: 'right' },
    { key: 'precio', label: 'Precio / ud.', type: 'currency', align: 'right' },
    { key: 'disponible', label: 'Stock', type: 'boolean', align: 'center' },
  ];

  materiales: Record<string, unknown>[] = [
    { material: 'Madera de pino', cantidad: 50, precio: 12.5, disponible: true },
    { material: 'Acero inoxidable', cantidad: 20, precio: 45.0, disponible: true },
    { material: 'Plástico ABS', cantidad: 0, precio: 8.75, disponible: false },
    { material: 'Aluminio', cantidad: 15, precio: 32.0, disponible: true },
    { material: 'Fibra de carbono', cantidad: 3, precio: 120.0, disponible: true },
  ];

  /* ── Tabla 3: con badges ── */
  columnasPedidos: Column[] = [
    { key: 'id', label: '#', align: 'center', width: '60px', sortable: false },
    { key: 'cliente', label: 'Cliente' },
    { key: 'producto', label: 'Producto' },
    { key: 'total', label: 'Total', type: 'currency', align: 'right' },
    { key: 'fecha', label: 'Fecha', type: 'date', align: 'center' },
    { key: 'pagado', label: 'Pagado', type: 'boolean', align: 'center' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeMap: {
        Enviado: '#17a2b8',
        Entregado: '#28a745',
        Pendiente: '#ffc107',
        Cancelado: '#dc3545',
      },
    },
  ];

  pedidos: Record<string, unknown>[] = [
    { id: 1, cliente: 'María García', producto: 'Silla nórdica', total: 125.5, fecha: '2025-05-28', pagado: true, estado: 'Entregado' },
    { id: 2, cliente: 'Juan López', producto: 'Mesa escritorio', total: 289.99, fecha: '2025-05-29', pagado: false, estado: 'Pendiente' },
    { id: 3, cliente: 'Ana Martínez', producto: 'Estantería', total: 89.0, fecha: '2025-05-30', pagado: true, estado: 'Enviado' },
    { id: 4, cliente: 'Carlos Ruiz', producto: 'Lámpara LED', total: 45.0, fecha: '2025-05-31', pagado: false, estado: 'Cancelado' },
    { id: 5, cliente: 'Lucía Fernández', producto: 'Sofá 3 plazas', total: 599.0, fecha: '2025-05-31', pagado: true, estado: 'Enviado' },
  ];

  /* ── Cards ── */
  productos = [
    {
      id: 1,
      titulo: 'Silla nórdica',
      subtitulo: 'Mobiliario · Madera',
      precio: 299,
      imagen: 'https://picsum.photos/seed/silla/400/300',
      badge: 'Nuevo',
      descripcion: 'Diseño escandinavo con patas de madera maciza y asiento tapizado.',
    },
    {
      id: 2,
      titulo: 'Mesa escritorio',
      subtitulo: 'Mobiliario · Roble',
      precio: 450,
      imagen: 'https://picsum.photos/seed/mesa/400/300',
      badge: '',
      descripcion: 'Superficie amplia con cajón lateral y patas ajustables en altura.',
    },
    {
      id: 3,
      titulo: 'Lámpara de arco',
      subtitulo: 'Iluminación · Metal',
      precio: 129,
      imagen: 'https://picsum.photos/seed/lampara/400/300',
      badge: '-20%',
      descripcion: 'Brazo articulado con pantalla de tela y base de mármol.',
    },
    {
      id: 4,
      titulo: 'Estantería flotante',
      subtitulo: 'Almacenaje · Pino',
      precio: 89,
      imagen: 'https://picsum.photos/seed/estanteria/400/300',
      badge: '',
      descripcion: 'Tres baldas de 80cm con soportes ocultos de acero.',
    },
    {
      id: 5,
      titulo: 'Sofá 3 plazas',
      subtitulo: 'Salón · Tela',
      precio: 599,
      imagen: 'https://picsum.photos/seed/sofa/400/300',
      badge: 'Bestseller',
      descripcion: 'Tapizado de microfibra lavable, estructura de madera maciza.',
    },
    {
      id: 6,
      titulo: 'Espejo redondo',
      subtitulo: 'Decoración · Metal',
      precio: 75,
      imagen: 'https://picsum.photos/seed/espejo/400/300',
      badge: '',
      descripcion: 'Marco metálico dorado, 60cm de diámetro. Incluye anclaje.',
    },
  ];

  /* ── Formulario contacto ── */
  camposContacto: FormField[] = [
    { key: 'nombre',   label: 'Nombre',   type: 'text',  required: true, placeholder: 'Tu nombre' },
    { key: 'email',    label: 'Email',    type: 'email', required: true, placeholder: 'tu@email.com' },
    { key: 'asunto',   label: 'Asunto',   type: 'select', required: true,
      placeholder: 'Selecciona un asunto',
      options: [
        { value: 'info',       label: 'Información general' },
        { value: 'presupuesto', label: 'Solicitar presupuesto' },
        { value: 'reserva',    label: 'Reservar cita' },
        { value: 'otro',       label: 'Otro' },
      ],
    },
    { key: 'mensaje',  label: 'Mensaje',  type: 'textarea', required: true,
      placeholder: 'Escribe tu mensaje...', rows: 4, minLength: 10,
      hint: 'Mínimo 10 caracteres' },
    { key: 'privacidad', label: 'Acepto la política de privacidad', type: 'checkbox', required: true, span: 2 },
  ];

  /* ── Formulario reserva (2 cols) ── */
  camposReserva: FormField[] = [
    { key: 'nombre',   label: 'Nombre',   type: 'text',  required: true, placeholder: 'Tu nombre' },
    { key: 'telefono', label: 'Teléfono', type: 'tel',   required: true, placeholder: '+34 600 000 000' },
    { key: 'fecha',    label: 'Fecha',    type: 'date',  required: true },
    { key: 'hora',     label: 'Hora',     type: 'select', required: true,
      options: ['10:00','11:00','12:00','13:00','16:00','17:00','18:00','19:00']
        .map(h => ({ value: h, label: h })) },
    { key: 'servicio', label: 'Servicio', type: 'radio', required: true, span: 2,
      options: [
        { value: 'tatuaje',  label: 'Tatuaje' },
        { value: 'piercing', label: 'Piercing' },
        { value: 'retoque',  label: 'Retoque' },
      ],
    },
    
    { key: 'notas', label: 'Notas adicionales', type: 'textarea',
      placeholder: 'Cuéntanos algo sobre lo que quieres...', rows: 3, span: 2 },
   
  { key: 'privacidad', label: 'Acepto la política de privacidad', type: 'checkbox', required: true, span: 2 },
  ];

  ultimoEnvio: Record<string, unknown> | null = null;
  formLoading = false;

  onFormSubmit(data: Record<string, unknown>): void {
    this.ultimoEnvio = data;
  }

  onFormCancel(): void {
    this.ultimoEnvio = null;
  }

  onReservaSubmit(data: Record<string, unknown>): void {
    this.formLoading = true;
    setTimeout(() => {
      this.formLoading = false;
      this.ultimoEnvio = data;
    }, 1500);
  }

  /* ── Productos ── */
  readonly catalogoProductos = DEMO_PRODUCTS;

  onAddToCart(product: Product): void {
    this.cartService.add(product);
  }

  /* ── Toasts / Modal / Skeleton / Loader ── */
  readonly toast        = inject(ToastService);
  readonly modalAbierto = signal(false);
  readonly modalConfirm = signal(false);
  readonly loaderActivo = signal(false);

  onConfirmDelete(): void {
    this.modalConfirm.set(false);
    this.toast.success('Producto eliminado', { title: 'Eliminado' });
  }

  simularCarga(): void {
    this.loaderActivo.set(true);
    setTimeout(() => {
      this.loaderActivo.set(false);
      this.toast.success('Cambios guardados correctamente');
    }, 2000);
  }

  /* ── Reservations ── */
  bookingServicios: BookingServiceModel[] = [
    { id: '1', name: 'Tatuaje pequeño',  description: 'Hasta 5cm. Línea fina, minimalista o geométrico.', durationMinutes: 60,  price: 80,  color: '#1e1e1e', imageUrl: 'https://picsum.photos/seed/tattoo1/64/64' },
    { id: '2', name: 'Tatuaje mediano',  description: 'Entre 5-15cm. Diseño a color o blackwork.',      durationMinutes: 120, price: 150, color: '#1e3a8a', imageUrl: 'https://picsum.photos/seed/tattoo2/64/64' },
    { id: '3', name: 'Tatuaje grande',   description: 'Más de 15cm. Proyecto personalizado.',            durationMinutes: 180, price: 250, color: '#3b0764', imageUrl: 'https://picsum.photos/seed/tattoo3/64/64' },
    { id: '4', name: 'Piercing',         description: 'Oreja, nariz, ceja, ombligo...',                  durationMinutes: 30,  price: 40,  color: '#065f46' },
    { id: '5', name: 'Consulta gratis',  description: 'Sin compromiso. Resolvemos tus dudas.',           durationMinutes: 30,  price: 0,   color: '#92400e' },
  ];

  bookingDisponibilidad: string[] = this.generateAvailableDates();
  bookingSlots: TimeSlot[] = [];

  private generateAvailableDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 3; i <= 45; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0 && d.getDay() !== 1) { // sin domingos ni lunes
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates.filter((_, idx) => idx % 3 !== 2); // quita un tercio
  }

  onServicioSeleccionado(s: BookingServiceModel): void {
    console.log('Servicio:', s.name);
  }

  onFechaSeleccionada(date: string): void {
    console.log('Fecha:', date);
    // En producción: llamarías a tu API para obtener los slots disponibles
    this.bookingSlots = [
      { time: '10:00', available: true,  label: '10:00 h' },
      { time: '11:00', available: false, label: '11:00 h' },
      { time: '12:00', available: true,  label: '12:00 h' },
      { time: '16:00', available: true,  label: '16:00 h' },
      { time: '17:00', available: true,  label: '17:00 h' },
      { time: '18:00', available: false, label: '18:00 h' },
      { time: '19:00', available: true,  label: '19:00 h' },
    ];
  }

  onReservaConfirmada(req: import('@org/models').BookingRequest): void {
    console.log('Reserva confirmada:', req);
  }

  /* ── CMS ── */
  private readonly http = inject(HttpClient);
  private readonly cmsPageFromApi = signal<CmsPage | null>(null);
  readonly cmsLanding = computed<CmsPage>(() => this.cmsPageFromApi() ?? CMS_LANDING_FALLBACK);

  constructor() {
    this.http.get<{ data: CmsPage }>(`${environment.apiUrl}/api/cms/pages/home`)
      .subscribe({ next: res => this.cmsPageFromApi.set(res.data) });
  }

  /* ── Ecommerce ── */
  readonly cartService     = inject(CartService);
  readonly mostrarCheckout = signal(false);

  demoOrders: import('@org/models').Order[] = [
    {
      id: 'ORD-2025-001',
      items: [{ product: DEMO_PRODUCTS[0], quantity: 1 }, { product: DEMO_PRODUCTS[2], quantity: 2 }],
      shipping: { name: 'Ana García', email: 'ana@demo.com', phone: '+34 600 000 000', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'ES' },
      payment: 'card', total: 557, status: 'delivered', createdAt: '2025-05-10T10:30:00Z', trackingCode: 'ES123456789',
    },
    {
      id: 'ORD-2025-002',
      items: [{ product: DEMO_PRODUCTS[4], quantity: 1 }],
      shipping: { name: 'Ana García', email: 'ana@demo.com', phone: '+34 600 000 000', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'ES' },
      payment: 'transfer', total: 599, status: 'shipped', createdAt: '2025-05-28T14:00:00Z',
    },
    {
      id: 'ORD-2025-003',
      items: [{ product: DEMO_PRODUCTS[1], quantity: 2 }],
      shipping: { name: 'Ana García', email: 'ana@demo.com', phone: '+34 600 000 000', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'ES' },
      payment: 'cash-on-delivery', total: 378, status: 'pending', createdAt: '2025-05-31T09:15:00Z',
    },
  ];

  onOrderPlaced(order: import('@org/models').OrderRequest): void {
    console.log('Pedido realizado:', order);
    setTimeout(() => this.mostrarCheckout.set(false), 4000);
  }

  onVerPedido(order: import('@org/models').Order): void {
    console.log('Ver pedido:', order.id);
  }

  /* ── Upload ── */
  readonly uploadProgress  = signal<number | null>(null);
  readonly uploadedFiles   = signal<File[]>([]);
  readonly lastUploadError = signal<UploadError | null>(null);

  onFilesSelected(files: File[]): void {
    this.uploadedFiles.set(files);
    this.lastUploadError.set(null);
  }

  onUploadError(err: UploadError): void {
    this.lastUploadError.set(err);
  }

  simularSubida(files: File[]): void {
    this.uploadedFiles.set(files);
    if (files.length === 0) { this.uploadProgress.set(null); return; }
    this.uploadProgress.set(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      this.uploadProgress.set(p);
      if (p >= 100) clearInterval(interval);
    }, 200);
  }

  resetProgress(): void { this.uploadProgress.set(null); }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* ── Animaciones ── */
  readonly animPlay = signal(true);

  animaciones = [
    { clase: 'animate-fade-in',    desc: 'Una vez — fade' },
    { clase: 'animate-slide-up',   desc: 'Una vez — sube' },
    { clase: 'animate-slide-down', desc: 'Una vez — baja' },
    { clase: 'animate-slide-left', desc: 'Una vez — izquierda' },
    { clase: 'animate-scale-in',   desc: 'Una vez — escala' },
    { clase: 'animate-pulse',      desc: 'Continua — pulsa' },
    { clase: 'animate-bounce',     desc: 'Continua — rebota' },
    { clase: 'animate-spin',       desc: 'Continua — gira' },
  ];

  reiniciarAnimaciones(): void {
    this.animPlay.set(false);
    // Al ser false, Angular elimina el @if del DOM.
    // En el siguiente tick lo añade de nuevo y las animaciones vuelven a ejecutarse.
    setTimeout(() => this.animPlay.set(true), 80);
  }

  /* ── Auth ── */
  readonly auth = inject(AuthService);

  socialProviders: SocialProvider[] = [
    GOOGLE('/api/auth/google'),
    GITHUB('/api/auth/github'),
    TWITTER('/api/auth/twitter'),
    FACEBOOK('/api/auth/facebook'),
  ];

  ultimoEventoAuth: Record<string, unknown> | null = null;

  onAuthSuccess(res: AuthResponse): void {
    this.ultimoEventoAuth = { evento: 'loginSuccess', user: res.user };
  }

  onAuthError(msg: string): void {
    this.ultimoEventoAuth = { evento: 'loginError', mensaje: msg };
  }

  onSocialClick(provider: SocialProvider): void {
    this.ultimoEventoAuth = { evento: 'socialClick', proveedor: provider.id, url: provider.url };
  }

  simularLogin(): void {
    this.auth.setSession({
      token: 'eyJhbGciOiJIUzI1NiJ9.demo_token_usuario',
      user: { id: '1', name: 'Ana García', email: 'ana@demo.com', roles: ['user'] },
    });
    this.ultimoEventoAuth = { evento: 'setSession', rol: 'user' };
  }

  simularAdmin(): void {
    this.auth.setSession({
      token: 'eyJhbGciOiJIUzI1NiJ9.demo_token_admin',
      user: { id: '99', name: 'Admin Demo', email: 'admin@demo.com', roles: ['user', 'admin'] },
    });
    this.ultimoEventoAuth = { evento: 'setSession', rol: 'admin' };
  }

  /* ── Opción B: overrides individuales ── */
  overrides = [
    { nombre: 'Solo primary', codigo: '--color-primary: #1e3a8a',
      primary: '#1e3a8a', accent: '#ff4d4d' },
    { nombre: 'Solo accent', codigo: '--color-accent: #f59e0b',
      primary: '#1e1e1e', accent: '#f59e0b' },
    { nombre: 'Primary + accent', codigo: '--color-primary: #065f46  --color-accent: #10b981',
      primary: '#065f46', accent: '#10b981' },
    { nombre: 'Primary oscuro azul + accent coral', codigo: '--color-primary: #1e3a8a  --color-accent: #f43f5e',
      primary: '#1e3a8a', accent: '#f43f5e' },
    { nombre: 'Primary negro + accent dorado', codigo: '--color-primary: #18181b  --color-accent: #eab308',
      primary: '#18181b', accent: '#eab308' },
    { nombre: 'Primary teal + accent lima', codigo: '--color-primary: #134e4a  --color-accent: #84cc16',
      primary: '#134e4a', accent: '#84cc16' },
  ];

  /* ── Paletas de ejemplo (nuevo sistema de 4 colores) ── */
  paletas = [
    {
      nombre: 'Rojo (defecto)',
      vars: '--p1:#1e1e1e; --p2:#ff4d4d; --p3:#e0e0e0; --p4:#f8f9fa;',
    },
    {
      nombre: 'Azul océano',
      vars: '--p1:#0c4a6e; --p2:#0ea5e9; --p3:#bae6fd; --p4:#f0f9ff;',
    },
    {
      nombre: 'Verde bosque',
      vars: '--p1:#14532d; --p2:#22c55e; --p3:#bbf7d0; --p4:#f0fdf4;',
    },
    {
      nombre: 'Naranja atardecer',
      vars: '--p1:#7c2d12; --p2:#f97316; --p3:#fed7aa; --p4:#fff7ed;',
    },
    {
      nombre: 'Violeta',
      vars: '--p1:#3b0764; --p2:#a855f7; --p3:#e9d5ff; --p4:#faf5ff;',
    },
    {
      nombre: 'Rosa',
      vars: '--p1:#881337; --p2:#f43f5e; --p3:#fecdd3; --p4:#fff1f2;',
    },
  ];
}
