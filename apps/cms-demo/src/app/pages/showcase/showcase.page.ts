import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CmsPageComponent } from '@org/cms';
import { CmsPage } from '@org/models';

/**
 * Página "kitchen-sink": renderiza **uno de cada** bloque del CMS, incluido el
 * bloque `calendar` (que vive en ng-reservations y se registra con `provideCmsBlocks`
 * en app.config.ts). Todo estático — no necesita backend salvo el calendario, que
 * lee de un JSON estático en /busy.json.
 */
@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [CmsPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-cms-page [page]="page" />`,
})
export class ShowcasePage {
  readonly page: CmsPage = {
    slug: 'showcase',
    title: 'Todos los bloques del CMS',
    blocks: [
      {
        type: 'hero',
        data: {
          title: 'Todos los bloques, en una página',
          subtitle: 'Demostración de cada tipo de bloque del CMS, incluido el calendario de reservas.',
          image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600&q=80',
          overlay: true,
          align: 'center',
          minHeight: '70vh',
          cta: { label: 'Ver bloques', href: '#features' },
          ctaSecondary: { label: 'Reservar', href: '#calendar' },
        },
      },
      {
        type: 'features',
        data: {
          title: '¿Por qué este CMS?',
          subtitle: 'Bloques componibles, accesibles y sin acoplamientos.',
          cols: 3,
          items: [
            { icon: '🧱', title: 'Componible', text: 'Cada sección es un bloque JSON. Reordena sin tocar código.' },
            { icon: '♿', title: 'Accesible', text: 'Patrones ARIA reales: foco visible, roles, teclado.' },
            { icon: '🔌', title: 'Desacoplado', text: 'El calendario es opt-in: el CMS no arrastra reservas.' },
          ],
        },
      },
      {
        type: 'text-image',
        data: {
          title: 'Texto e imagen, lado a lado',
          text: 'Ideal para contar una historia con apoyo visual. La imagen se coloca a izquierda o derecha y el texto admite HTML básico.',
          image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
          imagePosition: 'right',
          cta: { label: 'Saber más', href: '#' },
        },
      },
      {
        type: 'counters',
        data: {
          title: 'En números',
          cols: 3,
          items: [
            { value: 13, label: 'Tipos de bloque' },
            { value: 100, suffix: '%', label: 'Accesible' },
            { value: 0, label: 'Acoplamientos forzados' },
          ],
        },
      },
      {
        type: 'gallery',
        data: {
          title: 'Galería con lightbox',
          cols: 3,
          images: [
            { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80', alt: 'Montaña nevada', caption: 'Cima' },
            { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80', alt: 'Cielo al amanecer', caption: 'Amanecer' },
            { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80', alt: 'Bosque con niebla', caption: 'Bosque' },
          ],
        },
      },
      {
        type: 'testimonials',
        data: {
          title: 'Lo que dicen',
          items: [
            { text: 'Montamos la web del cliente en una tarde. Increíble.', author: 'Ana García', role: 'Estudio Norte', rating: 5 },
            { text: 'El editor visual lo usa la dueña sin ayuda.', author: 'Luis Romero', role: 'Peluquería Romero', rating: 5 },
          ],
        },
      },
      {
        type: 'pricing',
        data: {
          title: 'Planes',
          subtitle: 'Sin permanencia.',
          plans: [
            { name: 'Básico', price: 0, period: 'mes', description: 'Para empezar', features: ['1 página', 'Bloques estándar', 'Soporte por email'], cta: { label: 'Empezar', href: '#' } },
            { name: 'Pro', price: 29, period: 'mes', features: ['Páginas ilimitadas', 'Editor visual', 'Calendario de reservas', 'Soporte prioritario'], cta: { label: 'Contratar', href: '#' }, highlighted: true, badge: 'Más popular' },
            { name: 'Anual', price: 290, period: 'año', description: '2 meses gratis', features: ['Todo Pro', 'Dominio incluido'], cta: { label: 'Suscribirse', href: '#' } },
          ],
        },
      },
      {
        type: 'trust-badges',
        data: {
          align: 'center',
          items: [
            { icon: '🔒', text: 'Pago 100 % seguro' },
            { icon: '🚚', text: 'Envío gratis +50 €' },
            { icon: '🔄', text: 'Devoluciones 30 días' },
          ],
        },
      },
      {
        type: 'faq',
        data: {
          title: 'Preguntas frecuentes',
          items: [
            { question: '¿Necesito saber programar?', answer: 'No. Los bloques se editan desde el panel visual.' },
            { question: '¿El calendario es obligatorio?', answer: 'No. Es un bloque opt-in que vive en ng-reservations.' },
            { question: '¿Funciona en móvil?', answer: 'Sí, todos los bloques son responsive.' },
          ],
        },
      },
      {
        type: 'calendar',
        data: {
          title: 'Disponibilidad (solo lectura)',
          busyEndpoint: '/busy.json',
          monthsAhead: 2,
        },
      },
      {
        type: 'newsletter',
        data: {
          title: 'Únete a la newsletter',
          description: 'Novedades y lanzamientos, sin spam.',
          layout: 'inline',
          source: 'showcase',
          background: 'surface',
          align: 'center',
        },
      },
      {
        type: 'text',
        data: {
          content: '<p>Este bloque de <strong>texto</strong> admite HTML básico: <em>énfasis</em>, <a href="#">enlaces</a> y listas.</p>',
          align: 'center',
        },
      },
      {
        type: 'cta-banner',
        data: {
          title: '¿Listo para empezar?',
          subtitle: 'Crea tu primera página en minutos.',
          background: 'accent',
          cta: { label: 'Crear página', href: '/admin' },
          ctaSecondary: { label: 'Ver demo', href: '/' },
        },
      },
    ],
  };
}
