export type BookingStep = 'service' | 'staff' | 'date' | 'time' | 'form' | 'success';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/** Trabajador/profesional (vista pública para el flujo de reserva). */
export interface Staff {
  id:        string;
  name:      string;
  color?:    string;
  imageUrl?: string;
}

/** Selección de profesional en el flujo público: una persona concreta o "cualquiera disponible". */
export type StaffChoice = Staff | 'any';

/** Vista admin completa de un trabajador (CRUD del panel del jefe). */
export interface StaffAdmin extends Staff {
  active:      boolean;
  sortOrder:   number;
  userId?:     string;                       // cuenta vinculada (null = sin login)
  customHours: boolean;
  weeklyHours: Record<string, TimeRange[]>;  // MONDAY…SUNDAY → tramos
  blockedDates: string[];                    // vacaciones propias ISO 'YYYY-MM-DD'
  serviceIds:  string[];                     // servicios que realiza (vacío = todos)
}

export interface BookingService {
  id:              string;
  name:            string;
  description?:    string;
  durationMinutes: number;
  price?:          number;
  imageUrl?:       string;
  color?:          string;   // color del badge en el calendario
  active?:         boolean;  // visibilidad (solo en vista admin; el público recibe solo activos)
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
  /** Duración personalizada en minutos (alta admin de X horas). Si se omite, se usa la del servicio. */
  durationMinutes?: number;
  /** Profesional solicitado. Si se omite = "cualquiera": el backend asigna el primero libre. */
  staffId?:    string;
  staffName?:  string;
  staffColor?: string;
}

/**
 * Franja ocupada para el calendario público de solo-lectura.
 * NO contiene datos del cliente — solo cuándo está ocupado.
 */
export interface BusySlot {
  date:   string;   // ISO: '2025-06-15'
  start:  string;   // 'HH:mm'
  end:    string;   // 'HH:mm'
  label?: string;   // etiqueta opcional, p. ej. 'Ocupado'
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
  durationMinutes?: number;   // duración real (override admin); si falta, la del servicio
  status:      BookingStatus;
  createdAt:   string;
  staffId?:    string;        // trabajador asignado (null en datos sin asignar)
  staffName?:  string;
  staffColor?: string;
}

/**
 * Ajustes de reservas editables en caliente desde el panel (backend: GET/PUT
 * /api/admin/reservations/settings). Los días van en inglés y mayúsculas (MONDAY…SUNDAY).
 */
/** Un tramo horario de un día (p. ej. 09:00–13:00). Varios tramos = turno partido. */
export interface TimeRange {
  start: string;   // 'HH:mm'
  end:   string;   // 'HH:mm'
}

export interface ReservationsSettings {
  /** Día de la semana (MONDAY…SUNDAY) → tramos abiertos. Día ausente o vacío = cerrado. */
  weeklyHours:         Record<string, TimeRange[]>;
  slotIntervalMinutes: number;
  capacity:            number;   // reservas que pueden solaparse a la vez
  blockedDates:        string[]; // días cerrados (vacaciones/festivos) en ISO 'YYYY-MM-DD'
}
