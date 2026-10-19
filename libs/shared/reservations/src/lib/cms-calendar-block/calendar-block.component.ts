import { Component, ChangeDetectionStrategy, ViewEncapsulation, OnInit, input, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarBlockData, BusySlot } from '@org/models';
import { PublicCalendarComponent } from '../public-calendar/public-calendar.component';

/**
 * Bloque CMS de calendario público (vive en ng-reservations, no en ng-cms, para no acoplar el CMS
 * a las reservas). Regístralo en el CMS con `provideCmsBlocks({ calendar: CalendarBlockComponent })`.
 *
 * Obtiene las franjas ocupadas del endpoint configurado (por defecto `/api/busy`, del módulo
 * spring-reservations) y las pinta en `lib-public-calendar` (solo lectura, sin datos del cliente).
 */
@Component({
  selector: 'lib-cms-calendar',
  standalone: true,
  imports: [PublicCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section section--surface">
      <div class="container">
        <lib-public-calendar [title]="data().title || ''" [busy]="busy()" />
      </div>
    </section>
  `,
})
export class CalendarBlockComponent implements OnInit {
  readonly data = input.required<CalendarBlockData>();
  readonly busy = signal<BusySlot[]>([]);

  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    const endpoint = this.data().busyEndpoint || '/api/busy';
    const months   = this.data().monthsAhead ?? 2;

    const from = new Date();
    const to   = new Date(from.getFullYear(), from.getMonth() + months + 1, 0);
    const url  = `${endpoint}?from=${this.toDate(from)}&to=${this.toDate(to)}`;

    // Best-effort: si no hay backend, el calendario sale vacío (sin ocupación).
    this.http.get<unknown>(url).subscribe({
      next: (res) => this.busy.set(this.extract(res)),
      error: () => { /* sin datos */ },
    });
  }

  private extract(res: unknown): BusySlot[] {
    const r = res as { data?: BusySlot[] } | BusySlot[] | null;
    if (Array.isArray(r)) return r;
    return r?.data ?? [];
  }

  private toDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
