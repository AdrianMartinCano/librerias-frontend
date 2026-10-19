# @adrianmartincano/ng-reservations

Sistema de reservas para Angular: calendario de disponibilidad (lib-booking-calendar), selector de horas (lib-booking-slots) y flujo completo de reserva multi-paso (lib-booking-form). Para citas, sesiones, mesas o cualquier servicio con horario. Soporta **varios profesionales** (multistaff): agenda por trabajador, vista de día con una columna por profesional, y un jefe que ve/gestiona todas las agendas.

> **Formato e idioma:** los importes y las fechas del flujo de reserva se formatean con `Intl`
> nativo (sin `registerLocaleData`). Por defecto euros en formato español; **configurable**
> —otras monedas, conversión por tasas y selector en el navbar— con `provideLibFormat`. Ver
> [README raíz → Formato e idioma](../../../README.md#formato-e-idioma).

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-reservations
```

**Peer dependencies** (deben estar instaladas en tu proyecto):

| Paquete | Versión |
|---|---|
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@adrianmartincano/ng-theme` | `>=1.0.0` |

---

> Asegúrate de tener cargado el theme en tu `styles.css` global — los componentes usan sus variables CSS:
>
> ```css
> @import '@adrianmartincano/ng-theme/index.css';
> ```

---

## Reservations (`@adrianmartincano/ng-reservations`)

Sistema de reservas multi-paso: servicio → fecha → hora → datos del cliente → confirmación. Útil para tatuadoras, peluquerías, clínicas, restaurantes o cualquier negocio de servicios.

```typescript
import {
  BookingFormComponent, BookingCalendarComponent, BookingSlotsComponent,
  BookingAdminComponent, PublicCalendarComponent, BookingStateService,
  // Multistaff:
  StaffAdminComponent, StaffDayTimelineComponent, ServicesAdminComponent,
  BookingDetailModalComponent, VacationPickerComponent,
} from '@adrianmartincano/ng-reservations';
import { BookingService, TimeSlot, BookingRequest, BusySlot, Staff, StaffAdmin } from '@adrianmartincano/ng-models';
```

> **Nuevo:**
> - **`<lib-booking-admin>`** — panel de administración: calendario (cualquier día), servicio,
>   hora y **duración en horas** personalizada. Además de **crear**, permite **editar** y **cancelar**
>   las reservas existentes y **valida solapamientos** (no deja pisar el horario de otra cita el mismo
>   día). Inputs: `services`, `bookings` (el padre posee el array), `loading`, `submitLabel`. Outputs:
>   `created`, `updated` (`{ index, booking }`) y `cancelled` (`index`). Cada `BookingRequest` incluye
>   `durationMinutes`. Par backend: `POST/PUT/DELETE /api/bookings` (acepta `durationMinutes`).
>
>   ```html
>   <lib-booking-admin
>     [services]="servicios" [bookings]="reservas()" calendarName="Reservas"
>     (created)="add($event)" (updated)="edit($event)" (cancelled)="remove($event)"
>     (imported)="addMany($event)"
>   />
>   ```
> - **`<lib-reservations-settings>`** — formulario de ajustes editables en caliente: **horario por día
>   con turnos partidos** (cada día, cero o varios tramos mañana/tarde; sin tramos = cerrado), intervalo
>   de slots, **capacidad** y **vacaciones/días cerrados**. Autocontenido: carga y guarda contra
>   `GET/PUT /api/admin/reservations/settings` (sesión admin). El backend genera la disponibilidad por
>   tramo y rechaza días cerrados/vacaciones; `application.yml` solo aporta el horario por defecto.
> - **Integración con calendarios (estándar `.ics`, sin OAuth)** — sirve para Google, Apple y Outlook:
>   - **Exportar**: por reserva, menú "Añadir a calendario" (Google / Outlook / descargar `.ics`); o
>     **todas** las reservas en un único `.ics` ("Exportar .ics").
>   - **Importar**: sube un `.ics` (exportado de cualquier app) → previsualización → crea las reservas,
>     **omitiendo las que se solapen**. Emite el output `imported` con los eventos aceptados.
>   - Utilidades reutilizables exportadas: `buildIcs`, `parseIcs`, `googleCalendarUrl`, `outlookCalendarUrl`.
> - **`<lib-public-calendar>`** — calendario **de solo lectura** que muestra la ocupación
>   (`BusySlot[]`, sin datos del cliente). Par backend: `GET /api/busy?from&to`.
> - **`<lib-booking-calendar>`** gana `mode` (`available` | `all` | `readonly`) y `busyDates`.
> - **Calendario personalizable por CSS:** sus colores ya siguen tu marca (variables del theme), y su
>   aspecto se re-estila con variables `--cal-*` (redondeo de días, color de seleccionado/ocupado/hoy…)
>   **sin tocar el componente**. Ver [README de `ng-theme` → Calendario de reservas](../theme/README.md).
> - **`CalendarBlockComponent`** — bloque del CMS (opt-in) que envuelve `lib-public-calendar` y
>   consulta `/api/busy`. Para usarlo dentro de `ng-cms`:
>   `provideCmsBlocks({ calendar: CalendarBlockComponent })` (de `@adrianmartincano/ng-cms`). Así el
>   CMS solo depende de reservations si **tú** registras el bloque.

---

## Multistaff — varios profesionales

Para negocios con varios trabajadores (peluquería/tatuador con varios artistas, clínica con varios
profesionales…). Todos los componentes son **controlados**: el *host* posee los datos y hace el HTTP.
Con **0 o 1 profesional** la UI se comporta como antes (sin selector ni columnas), así que es
retrocompatible.

| Componente | Para qué | Par backend |
|---|---|---|
| `<lib-staff-admin>` | CRUD de profesionales: datos, foto (subida), color, orden, **horario propio** (turnos por día), **vacaciones** y **servicios que realiza**; vínculo a cuenta o **crear cuenta nueva** (email+contraseña) | `…/admin/reservations/staff`, `POST /api/admin/users` |
| `<lib-services-admin>` | Editar el **catálogo** de servicios (precio, duración, color…) | `…/admin/reservations/services` |
| `<lib-staff-day-timeline>` | **Vista de día** con una columna por profesional; flechas de día anterior/siguiente; días pasados en solo lectura | `GET …/reservations/bookings/day` |
| `<lib-booking-detail-modal>` | Detalle de una cita con **edición completa** y cancelar (`readonly` para días pasados) | `PATCH/PUT …/bookings/{id}` |
| `<lib-vacation-picker>` | Selección de varias fechas sobre el calendario themeable (día suelto / rango / limpiar todo) — usado por staff-admin | — |

**Flujo público con profesional.** `<lib-booking-form>` admite el input `profesionales: Staff[]`. Con
2+ aparece el paso **"¿con quién?"** (un profesional concreto o *cualquiera disponible*) entre servicio
y fecha, y emite `profesionalSeleccionado` (para que recargues la disponibilidad con `?staffId=`). El
`BookingRequest` resultante lleva `staffId` (omitido = "cualquiera", el backend asigna el primero libre).

**Solape por trabajador.** `<lib-booking-admin>` gana el input `profesionales` y un selector de
profesional; el solapamiento se valida **por agenda** (dos profesionales pueden coincidir en hora).

```html
<!-- Panel del jefe: equipo, catálogo y agenda del día -->
<lib-services-admin [services]="servicios()" (created)="..." (updated)="..." (toggled)="..." (deleted)="..." />
<lib-staff-admin [staff]="equipo()" [users]="cuentas()" [services]="servicios()"
  (created)="..." (updated)="..." (toggled)="..." (deleted)="..." (includeMe)="..." />
<lib-staff-day-timeline [staff]="profesionales()" [bookings]="reservas()" [date]="dia()"
  [readonly]="dia() < hoy" (dateChange)="dia.set($event)" (bookingOpened)="abrirDetalle($event)" />
```

> **Roles.** El jefe es `ROLE_ADMIN` (ve/gestiona todo); un trabajador con cuenta es `ROLE_STAFF` (el
> backend lo acota a su propia agenda). El **primer admin** lo siembra el backend al arrancar
> (`pimon.users.create-default-admin`). Un jefe que además atiende = `ROLE_ADMIN` + su propia ficha de
> profesional ("Incluirme").

---

### `<lib-booking-form>` — Flujo completo

El componente principal que orquesta todos los pasos.

```html
<lib-booking-form
  [servicios]="misServicios"
  [disponibilidad]="fechasDisponibles"
  [slots]="horasDisponibles"
  [cargando]="cargando"
  mensajeExito="¡Reserva confirmada! Te enviamos un email."
  (servicioSeleccionado)="cargarFechas($event)"
  (fechaSeleccionada)="cargarHoras($event)"
  (reservaConfirmada)="enviarAlBackend($event)"
/>
```

#### Inputs

| Input | Tipo | Descripción |
|---|---|---|
| `servicios` | `BookingService[]` | Lista de servicios disponibles (obligatorio) |
| `disponibilidad` | `string[]` | Fechas disponibles en formato `'YYYY-MM-DD'`. El padre las provee (tras llamar a la API) |
| `slots` | `TimeSlot[]` | Horas disponibles para la fecha seleccionada. Se actualizan cuando cambia la fecha |
| `cargando` | `boolean` | Muestra spinner mientras se cargan fechas u horas |
| `mensajeExito` | `string` | Mensaje en el paso final |

#### Outputs

| Output | Tipo | Cuándo se emite |
|---|---|---|
| `servicioSeleccionado` | `BookingService` | Usuario elige servicio → el padre puede cargar fechas de disponibilidad de la API |
| `fechaSeleccionada` | `string` | Usuario elige fecha → el padre puede cargar los slots de la API |
| `reservaConfirmada` | `BookingRequest` | Usuario confirma → el padre envía al backend |

#### Flujo en la app

```typescript
// page.component.ts
servicios: BookingService[] = [
  { id: '1', name: 'Tatuaje pequeño', durationMinutes: 60,  price: 80 },
  { id: '2', name: 'Tatuaje mediano', durationMinutes: 120, price: 150 },
  { id: '3', name: 'Piercing',        durationMinutes: 30,  price: 40 },
];

disponibilidad: string[] = [];
slots: TimeSlot[] = [];
cargando = false;

onServicio(s: BookingService): void {
  this.cargando = true;
  this.api.getDisponibilidad(s.id).subscribe(dates => {
    this.disponibilidad = dates;   // ['2025-06-10', '2025-06-11', ...]
    this.cargando = false;
  });
}

onFecha(date: string): void {
  this.cargando = true;
  this.api.getSlots(this.servicioActual.id, date).subscribe(slots => {
    this.slots = slots;            // [{ time: '10:00', available: true }, ...]
    this.cargando = false;
  });
}

onReserva(req: BookingRequest): void {
  this.api.crearReserva(req).subscribe(() => {
    // La pantalla de éxito ya se muestra automáticamente
  });
}
```

---

### `<lib-booking-calendar>` — Calendario

```html
<lib-booking-calendar
  [disponibilidad]="fechasDisponibles"
  [selected]="fechaSeleccionada"
  (diaSeleccionado)="onFecha($event)"
/>
```

| Input | Tipo | Descripción |
|---|---|---|
| `disponibilidad` | `string[]` | Fechas disponibles `'YYYY-MM-DD'` — el resto aparecen desactivadas |
| `selected` | `string \| null` | Fecha actualmente seleccionada |
| `fechaMinima` | `string \| null` | No permite seleccionar antes de esta fecha (por defecto: hoy) |
| `fechaMaxima` | `string \| null` | No permite seleccionar después de esta fecha |

Navegación mes anterior/siguiente incluida. Los días pasados y no disponibles se deshabilitan automáticamente.

---

### `<lib-booking-slots>` — Slots de hora

```html
<lib-booking-slots
  [slots]="horasDisponibles"
  [selected]="slotSeleccionado"
  (slotSeleccionado)="onHora($event)"
/>
```

```typescript
slots: TimeSlot[] = [
  { time: '10:00', available: true,  label: '10:00 h' },
  { time: '11:00', available: false, label: '11:00 h' },  // tachado
  { time: '12:00', available: true,  label: '12:00 h' },
];
```

---

### Modelos

```typescript
interface BookingService {
  id:              string;
  name:            string;
  durationMinutes: number;
  price?:          number;
  description?:    string;
  imageUrl?:       string;
  color?:          string;  // color del avatar si no hay imagen
}

interface TimeSlot {
  time:      string;    // '10:00'
  available: boolean;
  label?:    string;    // '10:00 — 11:00' (se calcula si no se pasa)
}

interface BookingRequest {
  serviceId:   string;
  serviceName: string;
  date:        string;   // 'YYYY-MM-DD'
  time:        string;   // 'HH:mm'
  clientName:  string;
  clientEmail: string;
  clientPhone: string;
  notes?:      string;
  durationMinutes?: number;  // duración real (override admin); si falta, la del servicio
  staffId?:    string;       // profesional asignado (omitido = "cualquiera")
  staffName?:  string;
  staffColor?: string;
}

interface Staff { id: string; name: string; color?: string; imageUrl?: string; }
```

### Casos de uso

| Negocio | Servicios | Duración típica |
|---|---|---|
| Tatuadora | Tatuaje pequeño/mediano/grande, piercing, consulta | 30 min – 3 h |
| Peluquería | Corte, color, mechas, tratamiento | 30 min – 2 h |
| Clínica | Consulta general, revisión, cura | 15 min – 1 h |
| Restaurante | Mesa para 2, 4, 6 personas | 1.5 – 2 h |
| Fisioterapeuta | Sesión, valoración inicial | 45 – 60 min |

---

