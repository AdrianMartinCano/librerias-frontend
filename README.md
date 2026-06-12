# Shared UI Libraries — Frontend

![Frontend Logo](./logo.svg)

Monorepo Nx de **librerías Angular reutilizables** para acelerar el desarrollo de aplicaciones web profesionales.

Incluye componentes UI, modelos compartidos, servicios comunes y utilidades listas para producción.

**Stack:** Angular 17+ · Nx 18+ · TypeScript 5.9+ · Vite · CSS Variables · Mobile-first

Publicadas en GitHub Packages bajo el scope `@adrianmartincano`.

**Backend companion:** [`librerias-backend`](https://github.com/AdrianMartinCano/librerias-backend) — módulos Spring Boot compartidos

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
| `@adrianmartincano/ng-cms` | Renderizador de páginas por bloques (12 tipos) | [README](libs/shared/cms/README.md) |
| `@adrianmartincano/ng-cms-editor` | Panel admin del CMS: builder visual + preview en vivo | [README](libs/shared/cms-editor/README.md) |
| `@adrianmartincano/ng-reservations` | Calendario, slots de hora, flujo de reserva | [README](libs/shared/reservations/README.md) |
| `@adrianmartincano/ng-cookies` | Consentimiento RGPD: banner, preferencias, política | [README](libs/shared/cookies/README.md) |
| `@adrianmartincano/ng-legal` | Política de privacidad y aviso legal generados | [README](libs/shared/legal/README.md) |
| `@adrianmartincano/ng-newsletter` | Formulario/popup de suscripción + admin de campañas | [README](libs/shared/newsletter/README.md) |

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
git commit -m "chore: bump version to 0.3.9"
git tag v0.3.9
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

- **[PUBLISHING.md](./PUBLISHING.md)** — Guía completa: cómo publicar en GitHub Packages (npm)
- [docs/components.md](docs/components.md) — índice de la documentación por librería
- [docs/roadmap.md](docs/roadmap.md) — estado del proyecto y versiones publicadas
