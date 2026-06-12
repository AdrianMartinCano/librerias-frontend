export type BookingStep = 'service' | 'date' | 'time' | 'form' | 'success';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingService {
  id:              string;
  name:            string;
  description?:    string;
  durationMinutes: number;
  price?:          number;
  imageUrl?:       string;
  color?:          string;   // color del badge en el calendario
}

export interface TimeSlot {
  time:       string;    // '10:00', '11:30'
  available:  boolean;
  label?:     string;    // '10:00 — 11:30' (calculado automáticamente si no se pasa)
}

export interface BookingRequest {
  serviceId:   string;
  serviceName: string;
  date:        string;   // ISO: '2025-06-15'
  time:        string;   // '10:00'
  clientName:  string;
  clientEmail: string;
  clientPhone: string;
  notes?:      string;
}

export interface Booking {
  id:          string;
  service:     BookingService;
  date:        string;
  time:        string;
  clientName:  string;
  clientEmail: string;
  clientPhone: string;
  notes?:      string;
  status:      BookingStatus;
  createdAt:   string;
}
