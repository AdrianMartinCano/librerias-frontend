import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { BookingAdminComponent, PublicCalendarComponent, ReservationsSettingsComponent, BookingFormComponent } from '@org/reservations';
import { BookingService, BookingRequest, BusySlot, TimeSlot } from '@org/models';

/**
 * Demo de la vista ADMIN de reservas: a la izquierda el alta/gestión (calendario de cualquier día +
 * formulario con duración en horas, editar y cancelar); a la derecha, el calendario público que vería
 * un visitante. Al crear/editar/cancelar, la ocupación se recalcula y el público lo refleja.
 * Todo local (sin backend) para poder probarlo en el demo.
 */
@Component({
  selector: 'app-reservas-admin',
  standalone: true,
  imports: [BookingAdminComponent, PublicCalendarComponent, ReservationsSettingsComponent, BookingFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ra container">
      <header class="ra__head">
        <h1>Reservas · vista admin</h1>
        <p>Da de alta una cita de X horas en cualquier día, edítala o cancélala. No se permiten solapamientos. A la derecha, el calendario público (solo lectura, sin datos del cliente).</p>
      </header>

      <section class="ra__panel">
        <h2 class="ra__panel-title">Gestión (admin)</h2>
        <lib-booking-admin
          [services]="services"
          [bookings]="bookings()"
          calendarName="Reservas — Demo"
          (created)="onCreated($event)"
          (updated)="onUpdated($event)"
          (cancelled)="onCancelled($event)"
          (imported)="onImported($event)"
        />
      </section>

      <section class="ra__panel">
        <h2 class="ra__panel-title">Configuración (editable desde el panel)</h2>
        <p class="ra__hint">Días/horario, intervalo y capacidad. Se guarda en la BD vía
          <code>/api/admin/reservations/settings</code> (requiere backend + sesión admin).</p>
        <lib-reservations-settings />
      </section>

      <section class="ra__panel ra__panel--book">
        <h2 class="ra__panel-title">Cómo reserva el visitante</h2>
        <p class="ra__hint">Flujo público multi-paso (<code>lib-booking-form</code>): servicio → fecha →
          hora → datos. Aquí la disponibilidad y las horas son simuladas (en real las da el backend).</p>
        <lib-booking-form
          [servicios]="services"
          [disponibilidad]="availableDates()"
          [slots]="availableSlots()"
          mensajeExito="Te enviaremos un email de confirmación (demo: no se envía nada)."
          (servicioSeleccionado)="onPublicService()"
          (fechaSeleccionada)="onPublicDate()"
          (reservaConfirmada)="onPublicBooking($event)"
        />
      </section>

      <section class="ra__panel ra__panel--public">
        <h2 class="ra__panel-title">Cómo lo ve el público</h2>
        <lib-public-calendar title="Disponibilidad" [busy]="busy()" />
      </section>
    </div>
  `,
  styles: [`
    .ra { padding-block: 2rem 4rem; }
    .ra__head h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: .5rem; }
    .ra__head p { color: var(--color-text-muted, #666); max-width: 70ch; margin-bottom: 2rem; }
    .ra__panel {
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    /* El formulario de reserva es un widget: lo acotamos como en una web real */
    .ra__panel--book { max-width: 640px; }
    /* El calendario público es solo lectura: acotamos el panel para que no quede un div enorme */
    .ra__panel--public { max-width: 520px; }
    .ra__panel--public lib-public-calendar { display: block; }
    /* Demostración de personalización: re-estilamos SOLO el calendario público con las
       variables del theme (días circulares y ocupado más marcado), sin tocar el componente. */
    .ra__panel--public {
      --cal-day-radius: 999px;
      --cal-busy-bg: color-mix(in srgb, var(--color-accent) 24%, transparent);
    }
    .ra__panel-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.25rem; }
    .ra__hint { color: var(--color-text-muted, #666); font-size: .85rem; margin: -.75rem 0 1rem; }
  `],
})
export class ReservasAdminPage {
  readonly services: BookingService[] = [
    // Con imageUrl → se muestra la foto. Sin imageUrl → inicial sobre el color.
    { id: 's1', name: 'Tatuaje pequeño', durationMinutes: 60,  price: 80,  imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&q=80' },
    { id: 's2', name: 'Tatuaje mediano', durationMinutes: 120, price: 150, imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&q=80' },
    { id: 's3', name: 'Tatuaje grande',  durationMinutes: 240, price: 320, imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&q=80' },
    { id: 's4', name: 'Consulta diseño', durationMinutes: 30,  price: 0,   color: '#7c3aed' },
  ];

  readonly bookings = signal<BookingRequest[]>([
    { serviceId: 's2', serviceName: 'Tatuaje mediano', date: '2026-06-18', time: '09:00', durationMinutes: 240, clientName: 'Laura Gómez', clientEmail: 'laura@example.com', clientPhone: '600111222' },
    { serviceId: 's1', serviceName: 'Tatuaje pequeño', date: '2026-06-22', time: '11:00', durationMinutes: 60,  clientName: 'Marcos Ruiz', clientEmail: 'marcos@example.com', clientPhone: '600333444' },
  ]);

  /** Ocupación pública derivada de las reservas (sin datos del cliente). */
  readonly busy = computed<BusySlot[]>(() =>
    this.bookings().map((b) => ({
      date: b.date,
      start: b.time,
      end: this.addMinutes(b.time, b.durationMinutes ?? 60),
      label: 'Reservado',
    })),
  );

  onCreated(req: BookingRequest): void {
    this.bookings.update((list) => [...list, req]);
  }

  onUpdated({ index, booking }: { index: number; booking: BookingRequest }): void {
    this.bookings.update((list) => list.map((b, i) => (i === index ? booking : b)));
  }

  onCancelled(index: number): void {
    this.bookings.update((list) => list.filter((_, i) => i !== index));
  }

  onImported(events: BookingRequest[]): void {
    this.bookings.update((list) => [...list, ...events]);
  }

  /* ── Flujo público (lib-booking-form) — disponibilidad/horas simuladas ── */

  readonly availableDates = signal<string[]>([]);
  readonly availableSlots = signal<TimeSlot[]>([]);

  /** Al elegir servicio, el backend daría las fechas con hueco; aquí unas cuantas de ejemplo. */
  onPublicService(): void {
    this.availableDates.set(['2026-06-18', '2026-06-19', '2026-06-23', '2026-06-25', '2026-06-26', '2026-06-30']);
  }

  /** Al elegir fecha, el backend daría las horas; aquí unas cuantas (una ocupada). */
  onPublicDate(): void {
    this.availableSlots.set([
      { time: '10:00', available: true },
      { time: '11:00', available: true },
      { time: '12:00', available: false },
      { time: '16:00', available: true },
      { time: '17:00', available: true },
    ]);
  }

  /** El visitante confirma → en real iría al backend (POST /api/bookings). Aquí lo añadimos local. */
  onPublicBooking(req: BookingRequest): void {
    this.bookings.update((list) => [...list, req]);
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const hh = Math.floor((total % (24 * 60)) / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
}
