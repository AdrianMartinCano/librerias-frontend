/**
 * Modelos de reservas de restaurante (`@adrianmartincano/ng-dining`). Contraparte del backend
 * `spring-dining`. El eje del dominio es el nº de comensales (party) y la mesa asignada — distinto
 * de las citas (`reservations.models.ts`), donde el eje es el tiempo de un profesional.
 */

/** Estados que devuelve la API (enum del backend, en mayúsculas). Activos: PENDING/CONFIRMED/SEATED. */
export type DiningReservationStatus =
  | 'PENDING' | 'CONFIRMED' | 'SEATED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED';

/** Peticiones especiales de una reserva. */
export type SpecialRequest =
  | 'TRONA' | 'ACCESIBLE' | 'TERRAZA' | 'INTERIOR' | 'TRANQUILA' | 'CELEBRACION' | 'ALERGIAS';

/** Pasos del flujo público de reserva. */
export type DiningBookingStep = 'party' | 'date' | 'seating' | 'form' | 'success';

/** Día de la semana en inglés y mayúsculas (como en el backend). */
export type WeekDay =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Zone {
  id:        string;
  name:      string;
  sortOrder: number;
  active:    boolean;
}

export interface DiningTable {
  id:          string;
  label:       string;
  capacityMin: number;
  capacityMax: number;
  combinable:  boolean;
  sortOrder:   number;
  active:      boolean;
  posX?:       number;
  posY?:       number;
  zoneId:      string;
  zoneName:    string;
}

export interface Seating {
  id:              string;
  name:            string;
  start:           string;     // 'HH:mm'
  end:             string;     // 'HH:mm'
  durationMinutes: number;
  daysOfWeek:      WeekDay[];
  sortOrder:       number;
  active:          boolean;
}

/** Disponibilidad de un turno para un grupo. El público recibe `suggestedTableIds` vacío. */
export interface SeatingAvailability {
  seatingId:         string;
  seatingName:       string;
  start:             string;
  end:               string;
  available:         boolean;
  suggestedTableIds: string[];
}

/** Mesa(s) asignada(s) a una reserva (vista resumida). */
export interface DiningTableRef {
  id:        string;
  label:     string;
  zoneName?: string;
}

export interface DiningReservation {
  id:          string;
  date:        string;          // ISO 'YYYY-MM-DD'
  seatingId:   string;
  seatingName: string;
  start:       string;
  end:         string;
  partySize:   number;
  tables:      DiningTableRef[];
  clientName:  string;
  clientEmail: string;
  clientPhone: string;
  notes?:      string;
  requests:    SpecialRequest[];
  status:      DiningReservationStatus;
  deposit?:    number;
}

export interface DiningSettings {
  totalCapacity:   number;      // 0 = sin tope de aforo
  maxAdvanceDays:  number;
  minAdvanceHours: number;
  blockedDates:    string[];    // ISO 'YYYY-MM-DD'
}

/* ── Requests ── */

export interface CreateDiningReservationRequest {
  date:        string;
  seatingId:   string;
  partySize:   number;
  clientName:  string;
  clientEmail: string;
  clientPhone: string;
  notes?:      string;
  requests?:   SpecialRequest[];
  zoneId?:     string;          // preferencia de zona
  tableIds?:   string[];        // solo admin: mesas forzadas a mano
}

export interface UpdateDiningReservationRequest extends CreateDiningReservationRequest {
  status?: DiningReservationStatus;
}

export interface SaveZoneRequest {
  name:      string;
  sortOrder: number;
}

export interface SaveTableRequest {
  label:       string;
  capacityMin: number;
  capacityMax: number;
  combinable:  boolean;
  sortOrder:   number;
  posX?:       number;
  posY?:       number;
  zoneId:      string;
}

export interface SaveSeatingRequest {
  name:            string;
  start:           string;
  end:             string;
  durationMinutes: number;
  daysOfWeek:      WeekDay[];
  sortOrder:       number;
}
