import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { DiningReservation, DiningReservationStatus, DiningTable, Zone } from '@org/models';

const STATUS_LABEL: Record<DiningReservationStatus, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', SEATED: 'Sentados',
  NO_SHOW: 'No-show', CANCELLED: 'Cancelada', COMPLETED: 'Completada',
};

interface TableRow { table: DiningTable; reservations: DiningReservation[]; }
interface ZoneGroup { zone: Zone; rows: TableRow[]; }

/**
 * Plano de sala de un día: mesas agrupadas por zona, cada una con las reservas que tiene asignadas
 * (las que ocupan varias mesas aparecen en cada una). Componente controlado: el host carga las
 * reservas del día (`GET /api/admin/dining/reservations/day`) y reacciona a la navegación de fecha.
 */
@Component({
  selector: 'lib-dining-day',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-dd">
      <header class="lib-dd__head">
        <button type="button" class="lib-dd__nav" (click)="shiftDay(-1)" aria-label="Día anterior">‹</button>
        <h3 class="lib-dd__date">{{ date() }}</h3>
        <button type="button" class="lib-dd__nav" (click)="shiftDay(1)" aria-label="Día siguiente">›</button>
        <span class="lib-dd__count">{{ activeCount() }} reservas · {{ covers() }} comensales</span>
      </header>

      @if (loading()) {
        <p class="lib-dd__muted">Cargando…</p>
      } @else {
        @for (g of groups(); track g.zone.id) {
          <section class="lib-dd__zone">
            <h4 class="lib-dd__zone-name">{{ g.zone.name }}</h4>
            <div class="lib-dd__tables">
              @for (row of g.rows; track row.table.id) {
                <div class="lib-dd__table">
                  <div class="lib-dd__table-head">
                    <strong>{{ row.table.label }}</strong>
                    <small>{{ row.table.capacityMax }} personas</small>
                  </div>
                  @if (row.reservations.length === 0) {
                    <span class="lib-dd__free">libre</span>
                  } @else {
                    @for (r of row.reservations; track r.id) {
                      <button type="button" class="lib-dd__res lib-dd__res--{{ r.status }}" (click)="reservationOpened.emit(r)">
                        <span class="lib-dd__res-time">{{ r.start }}</span>
                        <span class="lib-dd__res-main">{{ r.clientName }} · {{ r.partySize }} pers.</span>
                        @if (r.tables.length > 1) {
                          <span class="lib-dd__res-join">🔗 {{ joinedLabels(r) }}</span>
                        }
                        <span class="lib-dd__res-status">{{ statusLabel(r.status) }}</span>
                      </button>
                    }
                  }
                </div>
              }
            </div>
          </section>
        } @empty {
          <p class="lib-dd__muted">No hay mesas configuradas.</p>
        }
      }
    </div>
  `,
  styles: [`
    .lib-dd { display: flex; flex-direction: column; gap: var(--space-5, 1.25rem); }
    .lib-dd__head { display: flex; align-items: center; gap: var(--space-3, .75rem); }
    .lib-dd__nav { width: 2.25rem; height: 2.25rem; border-radius: var(--radius-full, 999px); border: 1.5px solid var(--color-border, #e0e0e0); background: var(--color-background, #fff); cursor: pointer; font-size: 1.25rem; }
    .lib-dd__date { margin: 0; font-size: var(--font-size-lg, 1.125rem); font-weight: 700; }
    .lib-dd__count { margin-left: auto; color: var(--color-text-secondary, #595959); font-size: var(--font-size-sm, .875rem); }
    .lib-dd__muted { color: var(--color-text-muted, #909090); font-size: var(--font-size-sm, .875rem); }
    .lib-dd__zone-name { margin: 0 0 var(--space-2, .5rem); font-size: var(--font-size-base, 1rem); color: var(--color-text-secondary, #595959); }
    .lib-dd__tables { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3, .75rem); }
    .lib-dd__table {
      background: color-mix(in srgb, var(--color-text, #1a1a1a) 4%, var(--color-background, #fff));
      border: 1px solid color-mix(in srgb, var(--color-text, #1a1a1a) 12%, var(--color-background, #fff));
      border-radius: var(--radius-md, .5rem); padding: var(--space-3, .75rem);
      display: flex; flex-direction: column; gap: var(--space-2, .5rem);
      box-shadow: 0 1px 3px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.05);
    }
    .lib-dd__table-head { padding-bottom: var(--space-2, .5rem); border-bottom: 1px solid color-mix(in srgb, var(--color-text, #1a1a1a) 8%, transparent); }
    .lib-dd__table-head { display: flex; justify-content: space-between; align-items: baseline; }
    .lib-dd__table-head small { color: var(--color-text-muted, #909090); font-size: var(--font-size-xs, .75rem); }
    .lib-dd__free { font-size: var(--font-size-xs, .75rem); color: var(--color-text-muted, #b0b0b0); font-style: italic; }
    .lib-dd__res { display: grid; grid-template-columns: auto 1fr; gap: .15rem .5rem; text-align: left; border: 1px solid color-mix(in srgb, var(--color-text, #1a1a1a) 10%, transparent); border-left: 3px solid var(--color-border, #ccc); background: var(--color-background, #fff); border-radius: var(--radius-sm, .25rem); padding: .35rem .5rem; cursor: pointer; font-family: inherit; }
    .lib-dd__res:hover { filter: brightness(.97); }
    .lib-dd__res-time { font-weight: 700; font-variant-numeric: tabular-nums; }
    .lib-dd__res-main { font-size: var(--font-size-sm, .875rem); }
    .lib-dd__res-status { grid-column: 1 / -1; font-size: var(--font-size-xs, .75rem); color: var(--color-text-secondary, #595959); }
    .lib-dd__res-join { grid-column: 1 / -1; font-size: var(--font-size-xs, .75rem); color: var(--color-accent, #ff4d4d); font-weight: 600; }
    .lib-dd__res--PENDING   { border-left-color: var(--color-warning, #e0a800); }
    .lib-dd__res--CONFIRMED { border-left-color: var(--color-info, #3b82f6); }
    .lib-dd__res--SEATED    { border-left-color: var(--color-success, #2e9e5b); }
    .lib-dd__res--NO_SHOW, .lib-dd__res--CANCELLED { border-left-color: var(--color-danger, #d33); opacity: .6; }
    .lib-dd__res--COMPLETED { border-left-color: var(--color-text-muted, #909090); opacity: .7; }
  `],
})
export class DiningDayComponent {
  readonly date         = input.required<string>();
  readonly reservations = input<DiningReservation[]>([]);
  readonly tables       = input<DiningTable[]>([]);
  readonly zones        = input<Zone[]>([]);
  readonly loading      = input(false);

  readonly dateChange        = output<string>();
  readonly reservationOpened = output<DiningReservation>();

  private readonly active = computed(() =>
    this.reservations().filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED' || r.status === 'SEATED'));

  readonly activeCount = computed(() => this.active().length);
  readonly covers = computed(() => this.active().reduce((sum, r) => sum + r.partySize, 0));

  readonly groups = computed<ZoneGroup[]>(() => {
    const byTable = new Map<string, DiningReservation[]>();
    for (const r of this.reservations()) {
      for (const t of r.tables) {
        const list = byTable.get(t.id);
        if (list) list.push(r);
        else byTable.set(t.id, [r]);
      }
    }
    return this.zones()
      .filter(z => z.active)
      .map(zone => ({
        zone,
        rows: this.tables()
          .filter(t => t.zoneId === zone.id)
          .map(table => ({ table, reservations: byTable.get(table.id) ?? [] })),
      }))
      .filter(g => g.rows.length > 0);
  });

  statusLabel(s: DiningReservationStatus): string { return STATUS_LABEL[s]; }

  /** Etiquetas de las mesas unidas de una reserva (p. ej. "Mesa 2 + Mesa 3"). */
  joinedLabels(r: DiningReservation): string {
    return r.tables.map(t => t.label).join(' + ');
  }

  shiftDay(delta: number): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() + delta);
    this.dateChange.emit(d.toISOString().slice(0, 10));
  }
}
