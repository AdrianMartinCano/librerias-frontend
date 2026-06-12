# @adrianmartincano/ng-reservations

Sistema de reservas para Angular: calendario de disponibilidad (lib-booking-calendar), selector de horas (lib-booking-slots) y flujo completo de reserva multi-paso (lib-booking-form). Para citas, sesiones, mesas o cualquier servicio con horario.

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
| `@adrianmartincano/ng-theme` | `>=0.0.1` |

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
import { BookingFormComponent, BookingCalendarComponent, BookingSlotsComponent, BookingStateService } from '@adrianmartincano/ng-reservations';
import { BookingService, TimeSlot, BookingRequest } from '@adrianmartincano/ng-models';
```

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
}
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

