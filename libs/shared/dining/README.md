# @adrianmartincano/ng-dining

Reservas de **mesa** para bar/restaurante: zonas, mesas (capacidad en comensales), turnos y
asignación automática de mesa (best-fit + combinación) con plano de sala del día. Es un dominio
**distinto** de `@adrianmartincano/ng-reservations` (citas con profesional): aquí el eje es el **nº de
comensales** y la **mesa**, no el tiempo de un recurso.

> Contraparte backend: módulo `spring-dining` (`dev.pimon.dining`). Todos los componentes son
> **controlados**: el *host* posee los datos y hace el HTTP; los componentes emiten eventos.

---

## Instalación

```bash
npm install @adrianmartincano/ng-dining
```

**Peer dependencies:**

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=1.0.0` |
| `@adrianmartincano/ng-models` | `>=1.0.0` |

Carga el theme en tu `styles.css` global (los componentes usan sus variables CSS):

```css
@import '@adrianmartincano/ng-theme/index.css';
```

---

## Componentes

```typescript
import {
  DiningBookingFormComponent, DiningBookingStateService,
  ZonesAdminComponent, TablesAdminComponent, SeatingsAdminComponent,
  DiningSettingsComponent, DiningDayComponent, ReservationDetailComponent,
} from '@adrianmartincano/ng-dining';
import {
  Zone, DiningTable, Seating, DiningReservation, DiningSettings, SeatingAvailability,
  CreateDiningReservationRequest, UpdateDiningReservationRequest,
} from '@adrianmartincano/ng-models';
```

| Componente | Para qué | Par backend |
|---|---|---|
| `<lib-dining-booking-form>` | Flujo público: comensales → fecha → turno → datos → confirmación | `GET /api/dining/availability`, `POST /api/dining/reservations` |
| `<lib-dining-day>` | **Plano del día**: mesas por zona con sus reservas (indica mesas unidas 🔗) | `GET /api/admin/dining/reservations/day` |
| `<lib-dining-reservation-detail>` | Modal de edición completa: fecha, turno, comensales, estado y **reasignar mesas** | `PUT /api/admin/dining/reservations/{id}` |
| `<lib-zones-admin>` | CRUD de zonas (terraza/salón/barra) | `…/admin/dining/zones` |
| `<lib-tables-admin>` | CRUD de mesas: personas mín/máx, **combinable**, zona | `…/admin/dining/tables` |
| `<lib-seatings-admin>` | CRUD de turnos (días, horario, duración) | `…/admin/dining/seatings` |
| `<lib-dining-settings>` | Aforo por turno, antelación y días cerrados | `GET/PUT /api/admin/dining/settings` |

---

## Flujo público — `<lib-dining-booking-form>`

Componente controlado: el host carga la disponibilidad cuando el cliente elige fecha y crea la reserva
al confirmar. El componente lleva su propio estado de pasos (vía `DiningBookingStateService`).

```html
<lib-dining-booking-form #bf
  [zones]="zonas()"
  [availability]="disponibilidad()"
  [maxParty]="12"
  (availabilityRequested)="cargarDisponibilidad($event)"
  (reservaConfirmada)="crearReserva($event); bf.showSuccess()"
/>
```

| Input | Tipo | Descripción |
|---|---|---|
| `zones` | `Zone[]` | Zonas activas (preferencia opcional del cliente) |
| `availability` | `SeatingAvailability[]` | Turnos disponibles para la fecha/comensales (lo provee el host) |
| `maxParty` | `number` | Tope de comensales del selector (def. 12) |
| `loading` | `boolean` | Spinner mientras se cargan turnos |
| `successMessage` | `string` | Mensaje del paso final |

| Output | Tipo | Cuándo |
|---|---|---|
| `availabilityRequested` | `{ date; party; zoneId }` | El cliente elige fecha → carga `availability` |
| `reservaConfirmada` | `CreateDiningReservationRequest` | El cliente confirma → crea la reserva |

> Tras crear la reserva con éxito, llama a `showSuccess()` del componente (referencia de plantilla
> `#bf`) para mostrar la pantalla de confirmación.

```typescript
cargarDisponibilidad(q: { date: string; party: number; zoneId: string | null }) {
  this.api.getAvailability(q.date, q.party, q.zoneId).subscribe(a => this.disponibilidad.set(a));
}
crearReserva(req: CreateDiningReservationRequest) {
  this.api.createReservation(req).subscribe();  // POST /api/dining/reservations
}
```

---

## Panel — plano del día y detalle

```html
<!-- Plano: una columna por mesa, agrupadas por zona -->
<lib-dining-day
  [date]="dia()" [reservations]="reservasDelDia()" [tables]="mesas()" [zones]="zonas()"
  (dateChange)="dia.set($event)" (reservationOpened)="detalle.set($event)"
/>

<!-- Modal de edición (se muestra cuando reservation no es null) -->
<lib-dining-reservation-detail
  [reservation]="detalle()" [tables]="mesas()" [seatings]="turnos()"
  (saved)="actualizarReserva($event)" (closed)="detalle.set(null)"
/>
```

Una reserva con **mesas unidas** (`tables.length > 1`) se muestra en el plano bajo cada una de sus
mesas con el indicador `🔗 Mesa 2 + Mesa 3`.

---

## Mesas: capacidad y combinación

- **Personas mín./máx.** — rango de grupo que admite la mesa. El mín evita sentar grupos pequeños en
  mesas grandes (pon `1` para no fijar mínimo); el máx es el tope físico.
- **Combinable** — para grupos que no caben en una sola mesa, el backend **une** mesas combinables de
  la misma zona (p. ej. dos mesas de 4 para un grupo de 6). Si no es combinable, nunca se junta.

La asignación es **best-fit**: la mesa más ajustada que cubra al grupo; si ninguna sirve sola,
combinación mínima de mesas combinables de una zona.

---

## Ajustes (`<lib-dining-settings>`)

Editables en caliente (controlado: input `settings`, output `saved`). Solo afectan al **flujo
público**; el admin puede saltárselos.

| Ajuste | Significado |
|---|---|
| Aforo por turno | Máx. comensales sentados a la vez. `0` = sin tope (manda la capacidad de la mesa) |
| Antelación máx. (días) | Hasta cuándo se puede reservar a futuro |
| Antelación mín. (horas) | Cuánto antes del turno se admite reservar (`0` = hasta el último minuto) |
| Días cerrados | Fechas sin reservas (festivos/vacaciones) |
