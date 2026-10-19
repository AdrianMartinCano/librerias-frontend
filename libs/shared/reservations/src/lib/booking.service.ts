import { Injectable, signal, computed } from '@angular/core';
import { BookingService as Service, TimeSlot, BookingStep, StaffChoice } from '@org/models';

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  readonly step            = signal<BookingStep>('service');
  readonly selectedService = signal<Service | null>(null);
  readonly selectedStaff   = signal<StaffChoice | null>(null);
  readonly selectedDate    = signal<string | null>(null);
  readonly selectedSlot    = signal<TimeSlot | null>(null);

  /** El paso "profesional" solo existe si hay 2+ trabajadores; con 0/1 se omite. */
  readonly staffStepEnabled = signal(false);

  readonly canGoNext = computed(() => {
    switch (this.step()) {
      case 'service': return this.selectedService() !== null;
      case 'staff':   return this.selectedStaff() !== null;
      case 'date':    return this.selectedDate() !== null;
      case 'time':    return this.selectedSlot() !== null;
      case 'form':    return true;
      default:        return false;
    }
  });

  readonly summary = computed(() => ({
    service: this.selectedService(),
    staff:   this.selectedStaff(),
    date:    this.selectedDate(),
    slot:    this.selectedSlot(),
  }));

  selectService(s: Service): void {
    this.selectedService.set(s);
    // Si no hay paso de profesional, "cualquiera" queda preseleccionado.
    this.selectedStaff.set(this.staffStepEnabled() ? null : 'any');
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }

  selectStaff(choice: StaffChoice): void {
    this.selectedStaff.set(choice);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  selectSlot(slot: TimeSlot): void { this.selectedSlot.set(slot); }

  nextStep(): void {
    this.step.set(this.advance(this.step(), +1));
  }

  prevStep(): void {
    this.step.set(this.advance(this.step(), -1));
  }

  /** Secuencia de pasos, saltándose "profesional" si no está habilitado. */
  private order(): BookingStep[] {
    return this.staffStepEnabled()
      ? ['service', 'staff', 'date', 'time', 'form', 'success']
      : ['service', 'date', 'time', 'form', 'success'];
  }

  private advance(current: BookingStep, delta: 1 | -1): BookingStep {
    const seq = this.order();
    const i = seq.indexOf(current);
    if (i === -1) return current;
    const next = Math.min(Math.max(i + delta, 0), seq.length - 1);
    return seq[next];
  }

  reset(): void {
    this.step.set('service');
    this.selectedService.set(null);
    this.selectedStaff.set(this.staffStepEnabled() ? null : 'any');
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }
}
