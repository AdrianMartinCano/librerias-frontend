import { Injectable, signal, computed } from '@angular/core';
import { BookingService as Service, TimeSlot, BookingStep } from '@org/models';

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  readonly step            = signal<BookingStep>('service');
  readonly selectedService = signal<Service | null>(null);
  readonly selectedDate    = signal<string | null>(null);
  readonly selectedSlot    = signal<TimeSlot | null>(null);

  readonly canGoNext = computed(() => {
    switch (this.step()) {
      case 'service': return this.selectedService() !== null;
      case 'date':    return this.selectedDate() !== null;
      case 'time':    return this.selectedSlot() !== null;
      case 'form':    return true;
      default:        return false;
    }
  });

  readonly summary = computed(() => ({
    service: this.selectedService(),
    date:    this.selectedDate(),
    slot:    this.selectedSlot(),
  }));

  selectService(s: Service): void {
    this.selectedService.set(s);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  selectSlot(slot: TimeSlot): void { this.selectedSlot.set(slot); }

  nextStep(): void {
    const next: Record<BookingStep, BookingStep> = {
      service: 'date', date: 'time', time: 'form', form: 'success', success: 'success',
    };
    this.step.set(next[this.step()]);
  }

  prevStep(): void {
    const prev: Record<BookingStep, BookingStep> = {
      service: 'service', date: 'service', time: 'date', form: 'time', success: 'success',
    };
    this.step.set(prev[this.step()]);
  }

  reset(): void {
    this.step.set('service');
    this.selectedService.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }
}
