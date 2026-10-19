import { Injectable, computed, signal } from '@angular/core';
import { DiningBookingStep, SeatingAvailability } from '@org/models';

/**
 * Estado del flujo público de reserva de mesa: comensales → fecha → turno → datos → confirmación.
 * El componente `<lib-dining-booking-form>` lo orquesta; el host hace el HTTP (componente controlado).
 */
@Injectable({ providedIn: 'root' })
export class DiningBookingStateService {
  readonly step            = signal<DiningBookingStep>('party');
  readonly partySize       = signal<number | null>(null);
  readonly selectedDate    = signal<string | null>(null);
  readonly selectedSeating = signal<SeatingAvailability | null>(null);
  readonly zoneId          = signal<string | null>(null);

  readonly canGoNext = computed(() => {
    switch (this.step()) {
      case 'party':   return (this.partySize() ?? 0) > 0;
      case 'date':    return this.selectedDate() !== null;
      case 'seating': return this.selectedSeating() !== null;
      case 'form':    return true;
      default:        return false;
    }
  });

  setParty(n: number): void {
    this.partySize.set(n);
    this.selectedDate.set(null);
    this.selectedSeating.set(null);
  }

  setZone(zoneId: string | null): void {
    this.zoneId.set(zoneId);
    this.selectedSeating.set(null);
  }

  setDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedSeating.set(null);
  }

  setSeating(s: SeatingAvailability): void {
    this.selectedSeating.set(s);
  }

  next(): void { this.step.set(this.advance(+1)); }
  prev(): void { this.step.set(this.advance(-1)); }

  private order(): DiningBookingStep[] {
    return ['party', 'date', 'seating', 'form', 'success'];
  }

  private advance(delta: 1 | -1): DiningBookingStep {
    const seq = this.order();
    const i = seq.indexOf(this.step());
    if (i === -1) return this.step();
    return seq[Math.min(Math.max(i + delta, 0), seq.length - 1)];
  }

  reset(): void {
    this.step.set('party');
    this.partySize.set(null);
    this.selectedDate.set(null);
    this.selectedSeating.set(null);
    this.zoneId.set(null);
  }
}
