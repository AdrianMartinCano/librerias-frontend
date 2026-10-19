import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  BookingFormComponent,
  BookingAdminComponent,
  StaffDayTimelineComponent,
  StaffAdminComponent,
  ServicesAdminComponent,
  BookingDetailModalComponent,
  SaveStaffPayload,
  SaveServicePayload,
  StaffUserOption,
} from '@org/reservations';
import {
  BookingService, BookingRequest, Staff, StaffAdmin, TimeSlot, StaffChoice,
} from '@org/models';

/**
 * Demo MULTISTAFF (sin backend, todo mockeado). Monta los cuatro componentes nuevos para verlos:
 *  - StaffAdminComponent     → gestión del equipo (CRUD profesionales)
 *  - StaffDayTimelineComponent → vista de día con una columna por trabajador
 *  - BookingAdminComponent   → alta admin con selector de profesional y solape por persona
 *  - BookingFormComponent    → flujo público con el paso "¿con quién?"
 *
 * Los datos se mantienen en signals locales para que las acciones (crear/editar/cancelar) se reflejen
 * al instante entre los componentes.
 */
@Component({
  selector: 'app-reservas-multistaff',
  standalone: true,
  imports: [BookingFormComponent, BookingAdminComponent, StaffDayTimelineComponent, StaffAdminComponent, ServicesAdminComponent, BookingDetailModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ms container">
      <header class="ms__head">
        <h1>Reservas · multistaff (demo)</h1>
        <p>Todo simulado en el navegador, sin backend. Edita el equipo y verás cómo cambian las columnas
          del timeline, el selector de alta y el paso "¿con quién?" del flujo público.</p>
      </header>

      <!-- 0 · Catálogo de servicios -->
      <section class="ms__panel">
        <h2 class="ms__title">Catálogo de servicios</h2>
        <p class="ms__hint">Aquí el jefe define <strong>precio y duración</strong> de cada servicio (lo que
          luego ve el cliente en el flujo público). Editarlo cambia los servicios de los bloques de abajo.</p>
        <lib-services-admin
          [services]="services()"
          (created)="onServiceCreated($event)"
          (updated)="onServiceUpdated($event)"
          (toggled)="onServiceToggled($event)"
          (deleted)="onServiceDeleted($event)"
        />
      </section>

      <!-- 1 · Equipo -->
      <section class="ms__panel">
        <h2 class="ms__title">1 · Equipo</h2>
        <p class="ms__hint">El jefe da de alta a sus trabajadores: datos, color, orden y <strong>acceso</strong>
          (sin login, vincular a una cuenta existente, o <strong>crear cuenta nueva</strong> con email+contraseña
          y rol de trabajador). "Incluirme" simula al jefe creándose su propia agenda.</p>
        <lib-staff-admin
          [staff]="team()"
          [users]="users()"
          [services]="services()"
          (created)="onStaffCreated($event)"
          (updated)="onStaffUpdated($event)"
          (toggled)="onStaffToggled($event)"
          (deleted)="onStaffDeleted($event)"
          (includeMe)="onIncludeMe()"
        />
      </section>

      <!-- 2 · Timeline del día -->
      <section class="ms__panel">
        <h2 class="ms__title">2 · Agenda del día</h2>
        <p class="ms__hint">Día <strong>{{ day }}</strong>. Una columna por profesional activo. Pulsa un
          hueco para "crear" o un bloque para "editar" (aquí solo registramos la acción).</p>
        <lib-staff-day-timeline
          [staff]="activeStaff()"
          [bookings]="bookings()"
          [date]="day()"
          [readonly]="day() < today"
          [dayStart]="9"
          [dayEnd]="20"
          [hourHeight]="76"
          (dateChange)="day.set($event)"
          (slotClicked)="onSlot($event)"
          (bookingClicked)="onBookingClick($event)"
          (bookingOpened)="openDetail($event)"
        />
        <p class="ms__hint">💡 Usa las flechas para cambiar de día. Doble clic en una cita para abrir su
          detalle (editar / cancelar). Los días pasados se muestran en solo lectura.</p>
        @if (lastAction()) { <p class="ms__action">⚡ {{ lastAction() }}</p> }
      </section>

      <!-- Modal de detalle (se muestra cuando hay cita seleccionada) -->
      <lib-booking-detail-modal
        [booking]="selected()?.booking ?? null"
        [editingIndex]="selected()?.index ?? null"
        [services]="services()"
        [profesionales]="activeStaff()"
        [bookings]="bookings()"
        [readonly]="(selected()?.booking?.date ?? '') < today"
        (save)="onDetailSave($event)"
        (cancelBooking)="onDetailCancel()"
        (closed)="selected.set(null)"
      />

      <!-- 3 · Alta admin -->
      <section class="ms__panel">
        <h2 class="ms__title">3 · Alta / gestión</h2>
        <p class="ms__hint">Con profesionales, el formulario exige elegir uno y el solape se calcula por
          persona (dos profesionales pueden coincidir en hora).</p>
        <lib-booking-admin
          [services]="services()"
          [profesionales]="activeStaff()"
          [bookings]="bookings()"
          calendarName="Reservas — Demo multistaff"
          (created)="onCreated($event)"
          (updated)="onUpdated($event)"
          (cancelled)="onCancelled($event)"
          (imported)="onImported($event)"
        />
      </section>

      <!-- 4 · Flujo público -->
      <section class="ms__panel ms__panel--book">
        <h2 class="ms__title">4 · Flujo público</h2>
        <p class="ms__hint">Servicio → <strong>¿con quién?</strong> → fecha → hora → datos. Con un solo
          profesional el paso desaparece; aquí hay varios.</p>
        <lib-booking-form
          [servicios]="services()"
          [profesionales]="activeStaff()"
          [disponibilidad]="availableDates()"
          [slots]="availableSlots()"
          mensajeExito="Demo: no se envía nada."
          (servicioSeleccionado)="onPublicService()"
          (profesionalSeleccionado)="onPublicStaff($event)"
          (fechaSeleccionada)="onPublicDate()"
          (reservaConfirmada)="onPublicBooking($event)"
        />
      </section>
    </div>
  `,
  styles: [`
    .ms { padding-block: 2rem 4rem; }
    .ms__head h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: .5rem; }
    .ms__head p { color: var(--color-text-muted, #666); max-width: 72ch; margin-bottom: 2rem; }
    .ms__panel {
      background: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #e2e2e2);
      border-radius: var(--radius-lg, .75rem);
      padding: 1.5rem; margin-bottom: 1.5rem;
    }
    .ms__panel--book { max-width: 640px; }
    .ms__title { font-size: 1.1rem; font-weight: 600; margin-bottom: .35rem; }
    .ms__hint { color: var(--color-text-muted, #666); font-size: .85rem; margin: 0 0 1.25rem; }
    .ms__action { margin-top: 1rem; font-size: .9rem; color: var(--color-accent, #ff4d4d); font-weight: 600; }
  `],
})
export class ReservasMultistaffPage {
  /** "Hoy" simulado: los días anteriores se muestran en solo lectura. */
  readonly today = '2026-06-18';
  /** Día mostrado en el timeline (las flechas lo cambian). */
  readonly day = signal<string>(this.today);

  readonly services = signal<BookingService[]>([
    { id: 's1', name: 'Corte de pelo',  durationMinutes: 45,  price: 18, color: '#0ea5e9', active: true },
    { id: 's2', name: 'Tinte / color',  durationMinutes: 90,  price: 55, color: '#a855f7', active: true },
    { id: 's3', name: 'Tatuaje',        durationMinutes: 120, price: 150, color: '#1e3a8a', active: true },
    { id: 's4', name: 'Consulta diseño', durationMinutes: 30, price: 0,  color: '#22c55e', active: true },
  ]);

  /** Cuentas simuladas (en real las daría GET /api/admin/users) para el desplegable de vínculo. */
  readonly users = signal<StaffUserOption[]>([
    { id: 'u-jefe',  name: 'Ana (jefa)',  email: 'ana@studio.com' },
    { id: 'u-marta', name: 'Marta López',  email: 'marta@studio.com' },
    { id: 'u-juan',  name: 'Juan Pérez',   email: 'juan@studio.com' },
  ]);

  /** Equipo (StaffAdmin). El público/timeline usan solo los activos. */
  readonly team = signal<StaffAdmin[]>([
    { id: 'a1', name: 'Marta', color: '#e11d48', active: true, sortOrder: 0, userId: 'u-marta', customHours: false, weeklyHours: {}, blockedDates: [], serviceIds: [] },
    { id: 'a2', name: 'Juan',  color: '#2563eb', active: true, sortOrder: 1, customHours: false, weeklyHours: {}, blockedDates: [], serviceIds: ['s3'] },
    { id: 'a3', name: 'Lía',   color: '#16a34a', active: true, sortOrder: 2, customHours: false, weeklyHours: {}, blockedDates: [], serviceIds: [] },
  ]);

  /** Lista pública/columnas derivada de los profesionales activos. */
  readonly activeStaff = computed<Staff[]>(() =>
    this.team()
      .filter((s) => s.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ id: s.id, name: s.name, color: s.color, imageUrl: s.imageUrl })),
  );

  readonly bookings = signal<BookingRequest[]>([
    // Hoy (2026-06-18)
    { serviceId: 's1', serviceName: 'Corte de pelo', date: '2026-06-18', time: '09:30', durationMinutes: 45,  clientName: 'Lucía R.', clientEmail: 'lucia@example.com', clientPhone: '600111222', staffId: 'a1', staffName: 'Marta', staffColor: '#e11d48' },
    { serviceId: 's2', serviceName: 'Tinte / color', date: '2026-06-18', time: '11:00', durationMinutes: 90,  clientName: 'Eva P.',   clientEmail: 'eva@example.com',   clientPhone: '600222333', staffId: 'a1', staffName: 'Marta', staffColor: '#e11d48' },
    { serviceId: 's3', serviceName: 'Tatuaje',       date: '2026-06-18', time: '10:00', durationMinutes: 120, clientName: 'Pep R.',   clientEmail: 'pep@example.com',   clientPhone: '600333444', staffId: 'a2', staffName: 'Juan',  staffColor: '#2563eb' },
    { serviceId: 's4', serviceName: 'Consulta diseño', date: '2026-06-18', time: '12:30', durationMinutes: 30, clientName: 'Sara M.', clientEmail: 'sara@example.com',  clientPhone: '600444555', staffId: 'a3', staffName: 'Lía',   staffColor: '#16a34a' },
    // Ayer (2026-06-17) — solo lectura
    { serviceId: 's1', serviceName: 'Corte de pelo', date: '2026-06-17', time: '10:00', durationMinutes: 45,  clientName: 'Cliente Ayer', clientEmail: 'ayer@example.com', clientPhone: '600999000', staffId: 'a1', staffName: 'Marta', staffColor: '#e11d48' },
    // Mañana (2026-06-19)
    { serviceId: 's3', serviceName: 'Tatuaje',       date: '2026-06-19', time: '16:00', durationMinutes: 120, clientName: 'Cliente Mañana', clientEmail: 'manana@example.com', clientPhone: '600888111', staffId: 'a2', staffName: 'Juan', staffColor: '#2563eb' },
  ]);

  readonly lastAction = signal<string | null>(null);

  /* ── Equipo ── */

  onStaffCreated(payload: SaveStaffPayload): void {
    let userId = payload.userId;
    // Simula la orquestación del host: si pidió cuenta nueva, "crea" el usuario y vincula su id.
    if (payload.account) {
      userId = 'u-' + Math.random().toString(36).slice(2, 7);
      this.users.update((us) => [...us, { id: userId!, name: payload.account!.name, email: payload.account!.email }]);
      this.lastAction.set(`Cuenta creada (ROLE_STAFF): ${payload.account.email}`);
    }
    const id = 'a' + Math.random().toString(36).slice(2, 7);
    const { account, ...rest } = payload;
    this.team.update((list) => [...list, { id, ...rest, userId }]);
  }

  /* ── Catálogo de servicios ── */

  onServiceCreated(p: SaveServicePayload): void {
    const id = 's' + Math.random().toString(36).slice(2, 7);
    this.services.update((l) => [...l, { id, active: true, ...p }]);
  }
  onServiceUpdated({ id, payload }: { id: string; payload: SaveServicePayload }): void {
    this.services.update((l) => l.map((s) => (s.id === id ? { ...s, ...payload } : s)));
  }
  onServiceToggled(id: string): void {
    this.services.update((l) => l.map((s) => (s.id === id ? { ...s, active: s.active === false } : s)));
  }
  onServiceDeleted(id: string): void {
    this.services.update((l) => l.filter((s) => s.id !== id));
  }
  onStaffUpdated({ id, payload }: { id: string; payload: SaveStaffPayload }): void {
    this.team.update((list) => list.map((s) => (s.id === id ? { id, ...payload } : s)));
  }
  onStaffToggled(id: string): void {
    this.team.update((list) => list.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }
  onStaffDeleted(id: string): void {
    this.team.update((list) => list.filter((s) => s.id !== id));
  }
  onIncludeMe(): void {
    if (this.team().some((s) => s.userId === 'u-jefe')) return;
    this.team.update((list) => [
      ...list,
      { id: 'a-jefe', name: 'Ana (jefa)', color: '#f59e0b', active: true, sortOrder: list.length, userId: 'u-jefe', customHours: false, weeklyHours: {}, blockedDates: [], serviceIds: [] },
    ]);
  }

  /* ── Timeline ── */

  onSlot(e: { staffId: string; time: string }): void {
    const name = this.activeStaff().find((s) => s.id === e.staffId)?.name ?? '?';
    this.lastAction.set(`Nuevo hueco pulsado: ${name} a las ${e.time}`);
  }
  onBookingClick(b: BookingRequest): void {
    const end = this.addMinutes(b.time, b.durationMinutes ?? 60);
    const price = this.services().find((s) => s.id === b.serviceId)?.price;
    const precio = price != null ? ` · ${price} €` : '';
    this.lastAction.set(
      `Cita pulsada · 👤 ${b.staffName ?? '—'} · ${b.serviceName}${precio} · ` +
      `📅 ${b.date} 🕒 ${b.time}–${end} · ${b.clientName} · 📞 ${b.clientPhone}`,
    );
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor((total % 1440) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  /* ── Modal de detalle (doble clic) ── */

  readonly selected = signal<{ booking: BookingRequest; index: number } | null>(null);

  openDetail(b: BookingRequest): void {
    const index = this.bookings().indexOf(b);
    if (index >= 0) this.selected.set({ booking: b, index });
  }
  onDetailSave(updated: BookingRequest): void {
    const sel = this.selected();
    if (!sel) return;
    this.bookings.update((l) => l.map((b, i) => (i === sel.index ? updated : b)));
    this.selected.set(null);
    this.lastAction.set(`Cita actualizada: ${updated.serviceName} · ${updated.clientName}`);
  }
  onDetailCancel(): void {
    const sel = this.selected();
    if (!sel) return;
    this.bookings.update((l) => l.filter((_, i) => i !== sel.index));
    this.selected.set(null);
    this.lastAction.set('Cita cancelada');
  }

  /* ── Alta admin ── */

  onCreated(req: BookingRequest): void { this.bookings.update((l) => [...l, req]); }
  onUpdated({ index, booking }: { index: number; booking: BookingRequest }): void {
    this.bookings.update((l) => l.map((b, i) => (i === index ? booking : b)));
  }
  onCancelled(index: number): void { this.bookings.update((l) => l.filter((_, i) => i !== index)); }
  onImported(events: BookingRequest[]): void { this.bookings.update((l) => [...l, ...events]); }

  /* ── Flujo público (disponibilidad simulada) ── */

  readonly availableDates = signal<string[]>([]);
  readonly availableSlots = signal<TimeSlot[]>([]);

  onPublicService(): void {
    this.availableDates.set(['2026-06-18', '2026-06-19', '2026-06-23', '2026-06-25', '2026-06-26']);
  }
  onPublicStaff(choice: StaffChoice): void {
    // En real, recargaría availability con/sin staffId. Aquí solo lo registramos.
    const who = choice === 'any' ? 'cualquiera' : choice.name;
    this.lastAction.set(`Público eligió profesional: ${who}`);
  }
  onPublicDate(): void {
    this.availableSlots.set([
      { time: '09:30', available: true },
      { time: '10:30', available: true },
      { time: '11:30', available: false },
      { time: '16:00', available: true },
      { time: '17:00', available: true },
    ]);
  }
  onPublicBooking(req: BookingRequest): void { this.bookings.update((l) => [...l, req]); }
}
