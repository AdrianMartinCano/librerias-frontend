# Librerías Angular — monorepo NX

> 🪞 **Espejo público.** El desarrollo se hace en un repositorio privado; este se actualiza periódicamente con una instantánea del código.

Monorepo de **20 librerías Angular reutilizables** para montar webs de negocio (tiendas, reservas, restauración, CMS, blog, foro, eventos, legal/RGPD...) en horas en lugar de semanas. Publicadas en GitHub Packages bajo el scope `@adrianmartincano`.

**Stack:** Angular 21 · NX 22 · TypeScript 5.9 · CSS Variables · Mobile-first

Su contraparte backend (módulos Spring Boot) vive en [`libreriasBackend`](https://github.com/AdrianMartinCano/libreriasBackend).

---

## Librerías

Cada librería tiene su documentación completa (instalación, API y ejemplos) en su README:

| Paquete | Qué incluye | Docs |
|---|---|---|
| `@adrianmartincano/ng-theme` | Design system CSS: paleta 4 colores, modo oscuro, grid, animaciones | [README](libs/shared/theme/README.md) |
| `@adrianmartincano/ng-models` | Interfaces TypeScript compartidas | [README](libs/shared/models/README.md) |
| `@adrianmartincano/ng-ui` | Tabla, navbar, footer, botón, card, modal, loader, skeleton, toasts | [README](libs/shared/ui/README.md) |
| `@adrianmartincano/ng-forms` | Formulario dinámico con validación | [README](libs/shared/forms/README.md) |
| `@adrianmartincano/ng-auth` | Login/registro, JWT, guards, interceptor, social providers | [README](libs/shared/auth/README.md) |
| `@adrianmartincano/ng-upload` | Drag & drop, preview, validación, progreso | [README](libs/shared/upload/README.md) |
| `@adrianmartincano/ng-products` | Catálogo, tarjeta, grid con filtros, CartService | [README](libs/shared/products/README.md) |
| `@adrianmartincano/ng-ecommerce` | Carrito, checkout 5 pasos, historial de pedidos | [README](libs/shared/ecommerce/README.md) |
| `@adrianmartincano/ng-blog` | Feed del blog, detalle de post + comentarios, panel admin; nick en vivo | [README](libs/shared/blog/README.md) |
| `@adrianmartincano/ng-forum` | Foro: categorías, hilos, mensajes, reacciones, citas, notificaciones, búsqueda y panel de moderación | [README](libs/shared/forum/README.md) |
| `@adrianmartincano/ng-cms` | Renderizador de páginas por bloques (12 tipos) | [README](libs/shared/cms/README.md) |
| `@adrianmartincano/ng-cms-editor` | Panel admin del CMS: builder visual + preview en vivo | [README](libs/shared/cms-editor/README.md) |
| `@adrianmartincano/ng-reservations` | Calendario, slots de hora, flujo de reserva, **multistaff** (agenda por profesional + timeline de día) | [README](libs/shared/reservations/README.md) |
| `@adrianmartincano/ng-dining` | Reservas de mesa: zonas, mesas, turnos, plano del día, asignación best-fit + combinación | [README](libs/shared/dining/README.md) |
| `@adrianmartincano/ng-menu` | Carta y menú del día (alérgenos, raciones, publicar/clonar) + selector de estilo. Sin imágenes | [README](libs/shared/menu/README.md) |
| `@adrianmartincano/ng-cookies` | Consentimiento RGPD: banner, preferencias, política | [README](libs/shared/cookies/README.md) |
| `@adrianmartincano/ng-legal` | Política de privacidad y aviso legal generados | [README](libs/shared/legal/README.md) |
| `@adrianmartincano/ng-newsletter` | Formulario/popup de suscripción + admin de campañas | [README](libs/shared/newsletter/README.md) |
| `@adrianmartincano/ng-markdown` | Markdown reducido para texto del público: editor con barra de formato, emojis y vista previa | [README](libs/shared/markdown/README.md) |
| `@adrianmartincano/ng-events` | Webs de eventos (bodas, cumpleaños…) desde una sola config: preset de tema, reveal progresivo por fecha y RSVP | [README](libs/shared/events/README.md) |

---

## Arquitectura — capas de dependencia

El sistema está pensado como una pirámide. **`ng-theme` es la base de todo**: las otras 19
librerías lo declaran como `peerDependency`. Encima se apila el resto, sin ciclos.

```
                    ┌────────────────────────────────────────────────────┐
   COMPOSICIONES    │  ng-ecommerce   ng-newsletter   ng-cms             │
   (combinan libs)  │   →products      →ui,models      →newsletter       │
                    │   →forms                        ng-cms-editor →cms │
                    │  ng-blog  ng-forum              ng-events          │
                    │   →markdown                      →cms              │
                    └────────────────────────────────────────────────────┘
                    ┌────────────────────────────────────────────────────┐
   FEATURES         │  ng-ui  ng-forms  ng-products  ng-upload  ng-auth  │
   (componentes)    │  ng-cookies  ng-legal  ng-markdown                 │
                    │  ng-reservations  ng-dining  ng-menu               │
                    └────────────────────────────────────────────────────┘
                    ┌────────────────────────────────────────────────────┐
   FUNDAMENTOS      │   ng-theme  (estilos)      ng-models  (tipos)      │
   (sin deps)       │   ← base de TODAS          ← tipos compartidos     │
                    └────────────────────────────────────────────────────┘
```

- **`ng-theme`** — fundamento visual. Tokens CSS, dark mode, foco accesible, motion,
  utilidades. No tiene dependencias y **es obligatorio**: instálalo e impórtalo una vez
  en el `styles.css` de tu app y todas las demás librerías heredan su look.
- **`ng-models`** — fundamento de tipos. Interfaces TypeScript que comparten casi todas
  las librerías. Sin dependencias.
- **Capas superiores** — cada librería declara explícitamente de qué depende (ver la
  columna *Depende de* en [docs/components.md](docs/components.md)). Una librería nunca
  depende de otra de su misma capa o superior.

> **Regla de oro:** instalas `ng-theme` una vez (la base) y, a partir de ahí, solo añades
> las librerías de feature que necesites. El gestor de paquetes resuelve el resto por las
> `peerDependencies`.

### Cómo se hace cumplir (dentro del monorepo)

Esta jerarquía no es solo documental: está **enforced por Nx**.

- Cada proyecto lleva `tags` por capa en su `project.json`: `type:foundation`,
  `type:feature` o `type:composition` (todas además `scope:shared`).
- La regla `@nx/enforce-module-boundaries` (en `eslint.config.mjs`) impide que una capa
  dependa de otra superior. Una `feature` no puede importar una `composition`, etc.
- `ng-theme` es CSS global (no se importa en TypeScript), así que su dependencia se declara
  como `implicitDependencies: ["theme"]` en cada librería y app. Gracias a esto,
  **`nx affected` reconstruye y testea las 16 librerías cuando cambias el theme** — tocar la
  base ya no pasa desapercibido en CI.

---

## Empezar a usarlas en tu proyecto

**1.** Crea un `.npmrc` en la raíz de tu proyecto Angular:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**2.** Instala el theme (obligatorio) y lo que necesites:

```bash
npm install @adrianmartincano/ng-theme @adrianmartincano/ng-ui @adrianmartincano/ng-models
```

**3.** Importa el theme en tu `styles.css` global:

```css
@import '@adrianmartincano/ng-theme/index.css';

/* Personaliza tu marca con 4 colores */
:root {
  --p1: #1e3a8a;   /* oscuro: navbar, footer */
  --p2: #3b82f6;   /* acento: botones, links */
  --p3: #bfdbfe;   /* neutro: bordes */
  --p4: #eff6ff;   /* claro: fondos */
}
```

**4.** Usa los componentes:

```typescript
import { NavbarComponent, FooterComponent } from '@adrianmartincano/ng-ui';
import { NavItem } from '@adrianmartincano/ng-models';
```

Ejemplo real de app consumidora: [girandomadera](https://github.com/AdrianMartinCano/girandomadera).

---

## Formato e idioma

Los importes y las fechas se formatean con la API nativa **`Intl`** a través de un servicio
compartido (`FormatService`, en `@adrianmartincano/ng-models`), no con los pipes de Angular.
Por defecto: **euros en formato español** (`1.299,00 €`), sin configurar nada y sin necesidad
de `registerLocaleData` ni `LOCALE_ID`.

### Configurar monedas e idioma

Pásale la configuración en el bootstrap con `provideLibFormat`:

```typescript
import { provideLibFormat } from '@adrianmartincano/ng-models';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLibFormat({
      defaultCurrencyCode: 'EUR',
      dateLocale: 'es-ES',
      currencies: [
        { code: 'EUR', locale: 'es-ES', label: 'Euro',          symbol: '€', rate: 1 },
        { code: 'USD', locale: 'en-US', label: 'US Dollar',     symbol: '$', rate: 1.16 },
        { code: 'GBP', locale: 'en-GB', label: 'British Pound', symbol: '£', rate: 0.86 },
      ],
    }),
  ],
};
```

- **`rate`** es la tasa relativa a la moneda base (la de `rate: 1`). Si una moneda lo define,
  los importes se **convierten** antes de formatear; si se omite, solo se reformatea sin convertir.
  Los precios se expresan en la moneda base en tu código; el servicio aplica la conversión.
  > Las tasas son **estáticas**: las pones tú. La librería no consulta cotizaciones en vivo —
  > aliméntalas desde tu backend o una API de cambio. Para refrescarlas sin recargar, usa
  > `setRates(...)` / `setCurrencies(...)` (ver abajo). Las del ejemplo son orientativas.
- **Selector en el navbar.** Si configuras más de una moneda, `lib-navbar` muestra
  automáticamente un selector (junto al de idioma, e **independiente** de él). Cámbiala y todos
  los importes se actualizan al instante (es reactivo). Ocúltalo con `[showCurrencySwitch]="false"`.
- **Cambiar por código:** inyecta `FormatService` y usa `setCurrency('USD')`,
  o lee la activa con `currency()` / `currencyCode()`.
- **Tasas del backend (enganche listo):** usa `provideFxSync` para cargar las tasas de un
  endpoint al arrancar. Best-effort: si el backend no responde, se mantienen las de `provideLibFormat`.

  ```typescript
  import { provideLibFormat, provideFxSync } from '@adrianmartincano/ng-models';

  providers: [
    provideLibFormat({ defaultCurrencyCode: 'EUR', currencies: [...] }),
    provideFxSync({ url: '/api/fx' }),   // lee { data: { rates } } o { rates }
  ],
  ```

  Encaja directo con el módulo backend **`spring-fx`** (`/api/fx`), que sirve las tasas y puede
  refrescarlas en automático desde una API de cambio. Ver
  [librerias-backend → spring-fx](https://github.com/AdrianMartinCano/libreriasBackend/blob/main/docs/backend.md).
- **Actualizar tasas a mano en runtime:** si prefieres controlarlo tú, inyecta `FormatService`
  y llama a `setRates(...)` / `setCurrencies(...)` cuando quieras (es reactivo: los importes ya
  pintados se reformatean al instante). El servicio no consulta cotizaciones por su cuenta.

  ```typescript
  private readonly format = inject(FormatService);
  this.format.setRates({ USD: 1.16, GBP: 0.86 });
  ```

> **Ojo (gotcha de Angular):** esto solo afecta a los componentes de estas librerías. Si en
> *tu* app usas los pipes de Angular `currency`/`date`/`number` con un locale distinto de
> `en-US`, ahí sí debes registrarlo con `registerLocaleData`, o Angular lanzará
> `NG0701: Missing locale data`.

---

## Demo

```bash
npm install
npx nx serve demo        # http://localhost:4200
```

`apps/demo` muestra todas las librerías funcionando juntas (en local). `apps/cms-demo` es una demo específica del editor CMS.

---

## Estructura del repo

```
librerias/
├── apps/
│   ├── demo/         ← app demo con todas las librerías
│   ├── demo-e2e/     ← tests Playwright de la demo
│   └── cms-demo/     ← demo del editor CMS
├── libs/shared/      ← las 14 librerías (una carpeta por paquete)
│   └── <lib>/
│       ├── src/          ← código fuente
│       ├── publish.json  ← nombre, versión y peerDeps del paquete publicado
│       └── README.md     ← documentación de uso
├── docs/             ← índice de docs y estado del proyecto
└── publish.ps1       ← publicación manual local (alternativa al CI)
```

Dentro del workspace las libs se importan como `@org/<nombre>`; al publicarse, el CI reescribe esos imports a `@adrianmartincano/ng-<nombre>`.

---

## Publicar una nueva versión

El CI (GitHub Actions) publica los 14 paquetes al pushear un tag `v*`:

```bash
# 1. Sube la versión en los 14 libs/shared/*/publish.json
# 2. Commit + tag + push
git add libs/shared/*/publish.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push && git push --tags
```

Alternativa local sin CI: `./publish.ps1` (requiere `GITHUB_TOKEN` con permiso `write:packages`).

---

## Comandos útiles

```bash
npx nx serve demo                  # servir la demo
npx nx build demo                  # build de producción
npx nx run-many -t build           # build de todo
npx nx graph                       # grafo de dependencias
npx nx reset                       # limpiar caché de NX
```

---

## Documentación

- [docs/components.md](docs/components.md) — índice de la documentación por librería
- [docs/roadmap.md](docs/roadmap.md) — estado del proyecto y versiones publicadas
