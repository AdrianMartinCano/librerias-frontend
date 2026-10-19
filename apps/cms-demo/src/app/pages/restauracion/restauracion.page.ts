import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import {
  DiningBookingFormComponent, ZonesAdminComponent, TablesAdminComponent, SeatingsAdminComponent,
  DiningSettingsComponent, DiningDayComponent, ReservationDetailComponent, AvailabilityQuery,
} from '@org/dining';
import {
  MenuCategoriesAdminComponent, MenuItemsAdminComponent, MenuStylePickerComponent,
  DailyMenuAdminComponent, MenuPublicComponent,
} from '@org/menu';
import {
  Zone, DiningTable, Seating, DiningSettings, DiningReservation, SeatingAvailability,
  CreateDiningReservationRequest, UpdateDiningReservationRequest, SaveZoneRequest, SaveTableRequest,
  SaveSeatingRequest, WeekDay,
  MenuCategory, MenuItem, MenuPresentation, DailyMenu, Carta, CartaCategory,
  CreateMenuCategoryRequest, CreateMenuItemRequest, SaveDailyMenuRequest,
} from '@org/models';

const ALL_DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const rid = (p: string) => p + Math.random().toString(36).slice(2, 7);

/**
 * Demo de RESTAURACIÓN (sin backend, todo mockeado). Monta las dos librerías nuevas:
 *  - ng-dining: zonas, mesas, turnos, ajustes, plano del día, detalle/edición y flujo público.
 *  - ng-menu:   carta (categorías + platos), menú del día, selector de estilo y carta pública.
 * El estado vive en signals locales para que todo se refleje al instante entre componentes.
 */
@Component({
  selector: 'app-restauracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DiningBookingFormComponent, ZonesAdminComponent, TablesAdminComponent, SeatingsAdminComponent,
    DiningSettingsComponent, DiningDayComponent, ReservationDetailComponent,
    MenuCategoriesAdminComponent, MenuItemsAdminComponent, MenuStylePickerComponent,
    DailyMenuAdminComponent, MenuPublicComponent,
  ],
  template: `
    <div class="rt container">
      <header class="rt__head">
        <h1>Restauración · demo</h1>
        <p>Todo simulado en el navegador, sin backend. Edita mesas, turnos o la carta y verás cómo
          cambian el plano del día, el flujo de reserva y la carta pública.</p>
      </header>

      <!-- ─────────── RESERVAS (ng-dining) ─────────── -->
      <h2 class="rt__sec">Reservas de mesa</h2>

      <section class="rt__panel">
        <h3 class="rt__title">Zonas</h3>
        <lib-zones-admin [zones]="zones()"
          (created)="onZoneCreated($event)" (updated)="onZoneUpdated($event)"
          (toggled)="onZoneToggled($event)" (deleted)="onZoneDeleted($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Mesas</h3>
        <lib-tables-admin [tables]="tables()" [zones]="zones()"
          (created)="onTableCreated($event)" (updated)="onTableUpdated($event)"
          (toggled)="onTableToggled($event)" (deleted)="onTableDeleted($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Turnos</h3>
        <lib-seatings-admin [seatings]="seatings()"
          (created)="onSeatingCreated($event)" (updated)="onSeatingUpdated($event)"
          (toggled)="onSeatingToggled($event)" (deleted)="onSeatingDeleted($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Ajustes</h3>
        <lib-dining-settings [settings]="diningSettings()" (saved)="diningSettings.set($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Plano del día</h3>
        <lib-dining-day [date]="diningDate()" [reservations]="dayReservations()" [tables]="tables()" [zones]="zones()"
          (dateChange)="diningDate.set($event)" (reservationOpened)="openDetail.set($event)" />
      </section>

      <section class="rt__panel rt__panel--book">
        <h3 class="rt__title">Flujo público</h3>
        <lib-dining-booking-form #bf
          [zones]="activeZones()" [availability]="diningAvailability()"
          (availabilityRequested)="onAvailabilityRequested($event)"
          (reservaConfirmada)="onPublicBooking($event); bf.showSuccess()" />
      </section>

      <!-- ─────────── CARTA (ng-menu) ─────────── -->
      <h2 class="rt__sec">Carta y menú del día</h2>

      <section class="rt__panel">
        <h3 class="rt__title">Categorías</h3>
        <lib-menu-categories-admin [categories]="categories()"
          (created)="onCatCreated($event)" (updated)="onCatUpdated($event)"
          (toggled)="onCatToggled($event)" (deleted)="onCatDeleted($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Platos</h3>
        <lib-menu-items-admin [items]="items()" [categories]="categories()"
          (created)="onItemCreated($event)" (updated)="onItemUpdated($event)"
          (toggled)="onItemToggled($event)" (deleted)="onItemDeleted($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Estilo de la carta</h3>
        <lib-menu-style-picker [presentation]="presentation()" (saved)="presentation.set($event)" />
      </section>

      <section class="rt__panel">
        <h3 class="rt__title">Menú del día</h3>
        <lib-daily-menu-admin [dailyMenus]="dailyForDate()" [menuItems]="items()" [date]="menuDate()"
          (dateChange)="menuDate.set($event)"
          (created)="onDailyCreated($event)" (updated)="onDailyUpdated($event)"
          (published)="onDailyPublish($event, true)" (unpublished)="onDailyPublish($event, false)"
          (cloned)="onDailyCloned($event)" (deleted)="onDailyDeleted($event)" />
      </section>

      <section class="rt__panel rt__panel--carta">
        <h3 class="rt__title">Carta pública</h3>
        <lib-menu-public [carta]="carta()" [dailyMenus]="publishedToday()" />
      </section>
    </div>

    <lib-dining-reservation-detail
      [reservation]="openDetail()" [tables]="tables()" [seatings]="seatings()"
      (saved)="onDetailSaved($event)" (closed)="openDetail.set(null)" />
  `,
  styles: [`
    .rt { padding-block: 2rem 4rem; }
    .rt__head h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: .5rem; }
    .rt__head p { color: var(--color-text-muted, #666); max-width: 72ch; margin-bottom: 2rem; }
    .rt__sec { font-size: 1.4rem; font-weight: 700; margin: 2.5rem 0 1rem; border-bottom: 2px solid var(--color-accent, #ff4d4d); padding-bottom: .35rem; }
    .rt__panel { background: var(--color-surface, #f8f9fa); border: 1px solid var(--color-border, #e2e2e2); border-radius: var(--radius-lg, .75rem); padding: 1.5rem; margin-bottom: 1.5rem; }
    .rt__panel--book { max-width: 560px; }
    .rt__panel--carta { background: var(--color-background, #fff); }
    .rt__title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem; }
  `],
})
export class RestauracionPage {
  readonly today = new Date().toISOString().slice(0, 10);

  /* ═══════════ DINING ═══════════ */

  readonly zones = signal<Zone[]>([
    { id: 'z1', name: 'Salón', sortOrder: 0, active: true },
    { id: 'z2', name: 'Terraza', sortOrder: 1, active: true },
  ]);
  readonly activeZones = computed(() => this.zones().filter(z => z.active));

  readonly tables = signal<DiningTable[]>([
    { id: 't1', label: 'Mesa 1', capacityMin: 1, capacityMax: 2, combinable: true, sortOrder: 0, active: true, zoneId: 'z1', zoneName: 'Salón' },
    { id: 't2', label: 'Mesa 2', capacityMin: 2, capacityMax: 4, combinable: true, sortOrder: 1, active: true, zoneId: 'z1', zoneName: 'Salón' },
    { id: 't3', label: 'Mesa 3', capacityMin: 4, capacityMax: 6, combinable: false, sortOrder: 2, active: true, zoneId: 'z1', zoneName: 'Salón' },
    { id: 't4', label: 'Terraza 1', capacityMin: 2, capacityMax: 4, combinable: true, sortOrder: 0, active: true, zoneId: 'z2', zoneName: 'Terraza' },
  ]);

  readonly seatings = signal<Seating[]>([
    { id: 'se1', name: 'Comida', start: '13:00', end: '15:00', durationMinutes: 90, daysOfWeek: ALL_DAYS, sortOrder: 0, active: true },
    { id: 'se2', name: 'Cena', start: '20:00', end: '22:30', durationMinutes: 120, daysOfWeek: ALL_DAYS, sortOrder: 1, active: true },
  ]);

  readonly diningSettings = signal<DiningSettings>({ totalCapacity: 0, maxAdvanceDays: 60, minAdvanceHours: 1, blockedDates: [] });

  readonly diningDate = signal<string>(this.today);
  readonly reservations = signal<DiningReservation[]>([
    { id: 'r1', date: this.today, seatingId: 'se1', seatingName: 'Comida', start: '13:00', end: '15:00', partySize: 2, tables: [{ id: 't1', label: 'Mesa 1', zoneName: 'Salón' }], clientName: 'Lucía R.', clientEmail: 'lucia@example.com', clientPhone: '600111222', requests: [], status: 'CONFIRMED' },
    { id: 'r2', date: this.today, seatingId: 'se2', seatingName: 'Cena', start: '20:00', end: '22:30', partySize: 4, tables: [{ id: 't2', label: 'Mesa 2', zoneName: 'Salón' }], clientName: 'Pep R.', clientEmail: 'pep@example.com', clientPhone: '600333444', requests: ['CELEBRACION'], status: 'PENDING' },
    // Reserva con MESAS JUNTAS (grupo de 6): muestra el indicador 🔗 en el plano.
    { id: 'r3', date: this.today, seatingId: 'se1', seatingName: 'Comida', start: '13:00', end: '15:00', partySize: 6, tables: [{ id: 't2', label: 'Mesa 2', zoneName: 'Salón' }, { id: 't3', label: 'Mesa 3', zoneName: 'Salón' }], clientName: 'Grupo Marta', clientEmail: 'grupo@example.com', clientPhone: '600555666', requests: [], status: 'CONFIRMED' },
  ]);
  readonly dayReservations = computed(() => this.reservations().filter(r => r.date === this.diningDate()));

  readonly diningAvailability = signal<SeatingAvailability[]>([]);
  readonly openDetail = signal<DiningReservation | null>(null);

  /* ── Zonas ── */
  onZoneCreated(p: SaveZoneRequest): void { this.zones.update(l => [...l, { id: rid('z'), active: true, ...p }]); }
  onZoneUpdated({ id, payload }: { id: string; payload: SaveZoneRequest }): void { this.zones.update(l => l.map(z => z.id === id ? { ...z, ...payload } : z)); }
  onZoneToggled(id: string): void { this.zones.update(l => l.map(z => z.id === id ? { ...z, active: !z.active } : z)); }
  onZoneDeleted(id: string): void { this.zones.update(l => l.filter(z => z.id !== id)); }

  /* ── Mesas ── */
  onTableCreated(p: SaveTableRequest): void {
    this.tables.update(l => [...l, { id: rid('t'), active: true, zoneName: this.zoneName(p.zoneId), ...p }]);
  }
  onTableUpdated({ id, payload }: { id: string; payload: SaveTableRequest }): void {
    this.tables.update(l => l.map(t => t.id === id ? { ...t, ...payload, zoneName: this.zoneName(payload.zoneId) } : t));
  }
  onTableToggled(id: string): void { this.tables.update(l => l.map(t => t.id === id ? { ...t, active: !t.active } : t)); }
  onTableDeleted(id: string): void { this.tables.update(l => l.filter(t => t.id !== id)); }
  private zoneName(id: string): string { return this.zones().find(z => z.id === id)?.name ?? ''; }

  /* ── Turnos ── */
  onSeatingCreated(p: SaveSeatingRequest): void { this.seatings.update(l => [...l, { id: rid('se'), active: true, ...p }]); }
  onSeatingUpdated({ id, payload }: { id: string; payload: SaveSeatingRequest }): void { this.seatings.update(l => l.map(s => s.id === id ? { ...s, ...payload } : s)); }
  onSeatingToggled(id: string): void { this.seatings.update(l => l.map(s => s.id === id ? { ...s, active: !s.active } : s)); }
  onSeatingDeleted(id: string): void { this.seatings.update(l => l.filter(s => s.id !== id)); }

  /* ── Disponibilidad (cálculo simplificado para la demo) ── */
  onAvailabilityRequested(q: AvailabilityQuery): void {
    const list = this.seatings().filter(s => s.active).map<SeatingAvailability>(s => ({
      seatingId: s.id, seatingName: s.name, start: s.start, end: s.end,
      available: this.canSeat(q.party, q.zoneId), suggestedTableIds: [],
    }));
    this.diningAvailability.set(list);
  }
  private canSeat(party: number, zoneId: string | null): boolean {
    const tables = this.tables().filter(t => t.active && (!zoneId || t.zoneId === zoneId));
    if (tables.some(t => t.capacityMax >= party)) return true;
    // Combinación: suma de mesas combinables por zona.
    const byZone = new Map<string, number>();
    for (const t of tables.filter(t => t.combinable)) {
      byZone.set(t.zoneId, (byZone.get(t.zoneId) ?? 0) + t.capacityMax);
    }
    return [...byZone.values()].some(sum => sum >= party);
  }

  onPublicBooking(req: CreateDiningReservationRequest): void {
    const seating = this.seatings().find(s => s.id === req.seatingId);
    if (!seating) return;
    this.reservations.update(l => [...l, {
      id: rid('r'), date: req.date, seatingId: seating.id, seatingName: seating.name,
      start: seating.start, end: seating.end, partySize: req.partySize,
      tables: this.assignTables(req.partySize, req.zoneId ?? null),
      clientName: req.clientName, clientEmail: req.clientEmail, clientPhone: req.clientPhone,
      notes: req.notes, requests: req.requests ?? [], status: 'PENDING',
    }]);
  }

  /** Asignación simplificada para la demo: mesa única best-fit o, si no cabe, combinación por zona. */
  private assignTables(party: number, zoneId: string | null): DiningReservation['tables'] {
    const ref = (t: DiningTable) => ({ id: t.id, label: t.label, zoneName: t.zoneName });
    const tables = this.tables().filter(t => t.active && (!zoneId || t.zoneId === zoneId));
    const single = tables.filter(t => t.capacityMax >= party).sort((a, b) => a.capacityMax - b.capacityMax)[0];
    if (single) return [ref(single)];
    for (const z of [...new Set(tables.filter(t => t.combinable).map(t => t.zoneId))]) {
      const combo: DiningTable[] = [];
      let sum = 0;
      for (const t of tables.filter(t => t.combinable && t.zoneId === z).sort((a, b) => b.capacityMax - a.capacityMax)) {
        combo.push(t); sum += t.capacityMax;
        if (sum >= party) break;
      }
      if (sum >= party) return combo.map(ref);
    }
    return tables[0] ? [ref(tables[0])] : [];
  }

  onDetailSaved({ id, payload }: { id: string; payload: UpdateDiningReservationRequest }): void {
    const seating = this.seatings().find(s => s.id === payload.seatingId);
    const tableRefs = (payload.tableIds ?? []).map(tid => {
      const t = this.tables().find(x => x.id === tid);
      return { id: tid, label: t?.label ?? tid, zoneName: t?.zoneName };
    });
    this.reservations.update(l => l.map(r => r.id === id ? {
      ...r, date: payload.date, seatingId: payload.seatingId,
      seatingName: seating?.name ?? r.seatingName, start: seating?.start ?? r.start, end: seating?.end ?? r.end,
      partySize: payload.partySize, clientName: payload.clientName, clientEmail: payload.clientEmail,
      clientPhone: payload.clientPhone, notes: payload.notes, requests: payload.requests ?? r.requests,
      status: payload.status ?? r.status, tables: tableRefs.length ? tableRefs : r.tables,
    } : r));
    this.openDetail.set(null);
  }

  /* ═══════════ MENU ═══════════ */

  readonly categories = signal<MenuCategory[]>([
    { id: 'c1', name: 'Entrantes', slug: 'entrantes', icon: 'ENTRANTES', sortOrder: 0, active: true },
    { id: 'c2', name: 'Postres', slug: 'postres', icon: 'POSTRES', sortOrder: 1, active: true },
  ]);

  readonly items = signal<MenuItem[]>([
    { id: 'i1', name: 'Croquetas caseras', description: 'De jamón ibérico, crujientes.', price: 8.5, portions: [], allergens: ['GLUTEN', 'LACTEOS'], vegan: false, vegetarian: false, glutenFree: false, spicy: false, available: true, sortOrder: 0, categoryId: 'c1', categoryName: 'Entrantes' },
    { id: 'i2', name: 'Pulpo a la gallega', description: 'Con pimentón y AOVE.', portions: [{ label: 'Media', amount: 9 }, { label: 'Ración', amount: 16 }], allergens: ['MOLUSCOS'], vegan: false, vegetarian: false, glutenFree: true, spicy: false, badge: 'Sugerencia', available: true, sortOrder: 1, categoryId: 'c1', categoryName: 'Entrantes' },
    { id: 'i3', name: 'Tarta de queso', description: 'Horneada, cremosa.', price: 6, portions: [], allergens: ['HUEVOS', 'LACTEOS', 'GLUTEN'], vegan: false, vegetarian: true, glutenFree: false, spicy: false, available: true, sortOrder: 0, categoryId: 'c2', categoryName: 'Postres' },
  ]);

  readonly presentation = signal<MenuPresentation>({
    headingFont: 'DISPLAY', bodyFont: 'SERIF', accentColor: '#8a5a2b', layout: 'LIST',
    showPrices: true, showAllergens: true, currency: 'EUR',
  });

  readonly menuDate = signal<string>(this.today);
  readonly dailyMenus = signal<DailyMenu[]>([
    {
      id: 'd1', date: this.today, name: 'Menú del día', price: 14.5, description: 'Incluye pan, bebida y postre o café.',
      published: true, courses: [
        { id: 'co1', name: 'Primeros', choose: 1, options: [
          { id: 'o1', itemId: 'i1', name: 'Croquetas caseras', allergens: ['GLUTEN', 'LACTEOS'] },
          { id: 'o2', name: 'Ensalada de la huerta', allergens: [] },
        ] },
        { id: 'co2', name: 'Postres', choose: 1, options: [
          { id: 'o3', itemId: 'i3', name: 'Tarta de queso', allergens: ['HUEVOS', 'LACTEOS', 'GLUTEN'] },
        ] },
      ],
    },
  ]);
  readonly dailyForDate = computed(() => this.dailyMenus().filter(d => d.date === this.menuDate()));
  readonly publishedToday = computed(() => this.dailyMenus().filter(d => d.published && d.date === this.today));

  readonly carta = computed<Carta>(() => {
    const cats: CartaCategory[] = this.categories()
      .filter(c => c.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon,
        items: this.items().filter(i => i.available && i.categoryId === c.id).sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter(c => c.items.length > 0);
    return { categories: cats, presentation: this.presentation() };
  });

  /* ── Categorías ── */
  onCatCreated(p: CreateMenuCategoryRequest): void {
    this.categories.update(l => [...l, { id: rid('c'), slug: this.slug(p.name), icon: p.icon ?? 'NONE', active: true, name: p.name, description: p.description, sortOrder: p.sortOrder }]);
  }
  onCatUpdated({ id, payload }: { id: string; payload: CreateMenuCategoryRequest }): void {
    this.categories.update(l => l.map(c => c.id === id ? { ...c, name: payload.name, description: payload.description, icon: payload.icon ?? 'NONE', sortOrder: payload.sortOrder } : c));
  }
  onCatToggled(id: string): void { this.categories.update(l => l.map(c => c.id === id ? { ...c, active: !c.active } : c)); }
  onCatDeleted(id: string): void { this.categories.update(l => l.filter(c => c.id !== id)); }
  private slug(name: string): string { return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  /* ── Platos ── */
  onItemCreated(p: CreateMenuItemRequest): void {
    this.items.update(l => [...l, {
      id: rid('i'), name: p.name, description: p.description, price: p.price,
      portions: p.portions ?? [], allergens: p.allergens ?? [],
      vegan: p.vegan, vegetarian: p.vegetarian, glutenFree: p.glutenFree, spicy: p.spicy,
      badge: p.badge, available: true, sortOrder: p.sortOrder,
      categoryId: p.categoryId, categoryName: this.catName(p.categoryId),
    }]);
  }
  onItemUpdated({ id, payload }: { id: string; payload: CreateMenuItemRequest }): void {
    this.items.update(l => l.map(i => i.id === id ? {
      ...i, name: payload.name, description: payload.description, price: payload.price,
      portions: payload.portions ?? [], allergens: payload.allergens ?? [],
      vegan: payload.vegan, vegetarian: payload.vegetarian, glutenFree: payload.glutenFree, spicy: payload.spicy,
      badge: payload.badge, categoryId: payload.categoryId, categoryName: this.catName(payload.categoryId),
    } : i));
  }
  onItemToggled(id: string): void { this.items.update(l => l.map(i => i.id === id ? { ...i, available: !i.available } : i)); }
  onItemDeleted(id: string): void { this.items.update(l => l.filter(i => i.id !== id)); }
  private catName(id: string): string { return this.categories().find(c => c.id === id)?.name ?? ''; }

  /* ── Menú del día ── */
  onDailyCreated(p: SaveDailyMenuRequest): void { this.dailyMenus.update(l => [...l, this.buildDaily(rid('d'), p, false)]); }
  onDailyUpdated({ id, payload }: { id: string; payload: SaveDailyMenuRequest }): void {
    this.dailyMenus.update(l => l.map(d => d.id === id ? this.buildDaily(id, payload, d.published) : d));
  }
  onDailyPublish(id: string, published: boolean): void {
    this.dailyMenus.update(l => l.map(d => d.id === id ? { ...d, published, publishedAt: published ? new Date().toISOString() : undefined } : d));
  }
  onDailyCloned({ id, toDate }: { id: string; toDate: string }): void {
    const src = this.dailyMenus().find(d => d.id === id);
    if (!src) return;
    this.dailyMenus.update(l => [...l, { ...src, id: rid('d'), date: toDate, published: false, publishedAt: undefined }]);
  }
  onDailyDeleted(id: string): void { this.dailyMenus.update(l => l.filter(d => d.id !== id)); }

  private buildDaily(id: string, p: SaveDailyMenuRequest, published: boolean): DailyMenu {
    return {
      id, date: p.date, name: p.name, price: p.price, description: p.description, published,
      courses: p.courses.map((c, ci) => ({
        id: `${id}-c${ci}`, name: c.name, choose: c.choose,
        options: c.options.map((o, oi) => {
          const item = o.itemId ? this.items().find(i => i.id === o.itemId) : undefined;
          return {
            id: `${id}-c${ci}-o${oi}`, itemId: o.itemId,
            name: item?.name ?? o.name ?? '', description: item?.description ?? o.description,
            supplement: o.supplement, allergens: item?.allergens ?? o.allergens ?? [],
          };
        }),
      })),
    };
  }
}
