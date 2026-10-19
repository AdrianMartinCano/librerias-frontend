# @adrianmartincano/ng-auth

Autenticación completa para Angular: pantalla de login/registro (lib-login), AuthService con JWT, guard de rutas (authGuard), interceptor HTTP (authInterceptor) y botones de login social (Google, GitHub...).

---

## Instalación

Los paquetes se publican en GitHub Packages. Crea (una sola vez) un fichero `.npmrc` en la raíz de tu proyecto:

```
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Y después instala:

```bash
npm install @adrianmartincano/ng-auth
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

## Auth (`@adrianmartincano/ng-auth`)

Librería de autenticación: login/registro, JWT, guards e interceptor HTTP.

```typescript
import {
  LoginComponent,
  AuthService,
  authGuard, guestGuard, roleGuard, anyRoleGuard,
  authInterceptor,
  GOOGLE, GITHUB, TWITTER, FACEBOOK, APPLE, MICROSOFT, YOUTUBE,
} from '@adrianmartincano/ng-auth';
import { SocialProvider, AuthUser, AuthResponse } from '@adrianmartincano/ng-models';
```

---

### `<lib-login>` — Formulario de login y registro

Un único componente que gestiona login, registro y proveedores sociales.

> **Accesible:** inputs con `aria-invalid`/`aria-required`, errores enlazados con `aria-describedby`
> y `role="alert"`, y `autocomplete` correcto para gestores de contraseñas (`current-password` en
> login, `new-password` en registro).

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | `'Bienvenido'` | Título en modo login |
| `subtitle` | `string` | `''` | Subtítulo opcional |
| `logo` | `string` | `''` | URL de imagen del logo |
| `logoText` | `string` | `''` | Texto del logo |
| `submitLabel` | `string` | `'Iniciar sesión'` | Texto del botón login |
| `registerTitle` | `string` | `'Crear cuenta'` | Título en modo registro |
| `registerSubmitLabel` | `string` | `'Registrarse'` | Texto del botón registro |
| `initialMode` | `'login' \| 'register'` | `'login'` | Modo inicial |
| `showRegister` | `boolean` | `true` | Muestra el enlace "Crear cuenta" y permite cambiar al formulario de registro. Ponlo a `false` en paneles de admin o intranets donde los usuarios no se auto-registran |
| `forgotPasswordUrl` | `string` | `''` | URL de recuperar contraseña. Si está vacío, el enlace no aparece |
| `socialProviders` | `SocialProvider[]` | `[]` | Botones de login social. Array vacío `[]` = sin botones sociales. **Independiente de `showRegister`** — puedes tener social sin registro y viceversa |
| `showSocialText` | `boolean` | `true` | `true` → botones con texto ("Continuar con Google"), layout vertical. `false` → solo icono, botones circulares, layout horizontal |

#### Outputs

| Output | Tipo | Descripción |
|---|---|---|
| `loginSuccess` | `AuthResponse` | Login completado con éxito |
| `registerSuccess` | `AuthResponse` | Registro completado con éxito |
| `loginError` | `string` | Mensaje de error del servidor |
| `socialClick` | `SocialProvider` | Clic en un botón social (antes de redirigir) |

#### Slot `login-extra` — meter algo DENTRO de la tarjeta

Lo que se marque con el atributo `login-extra` se pinta dentro de la tarjeta, **entre el
formulario y el pie** («¿No tienes cuenta?»). Es el sitio de `<lib-google-button>`, que al ser
un componente aparte se quedaba por fuera:

```html
<lib-login [showRegister]="true" (loginSuccess)="onLogin($event)">
  <lib-google-button login-extra (loginSuccess)="onLogin($event)" />
</lib-login>
```

Sin nada proyectado la tarjeta queda **exactamente igual** que antes: el hueco no deja
espacio en blanco. Sirve para cualquier otra cosa que deba ir dentro de la tarjeta (un aviso
legal, un enlace de ayuda), no solo para el botón de Google.

#### Modos de uso según el proyecto

**Login público con registro y redes sociales** (tienda, asociación...):
```html
<lib-login
  [showRegister]="true"
  [socialProviders]="[GOOGLE('/api/auth/google'), GITHUB('/api/auth/github')]"
  (loginSuccess)="onLogin($event)"
/>
```

**Solo iconos circulares** (cuando el espacio es limitado o el diseño es minimalista):
```html
<lib-login
  [socialProviders]="[GOOGLE('/api/auth/google'), GITHUB('/api/auth/github')]"
  [showSocialText]="false"
  (loginSuccess)="onLogin($event)"
/>
```
Los botones quedan circulares en fila horizontal. El `title` del HTML muestra el nombre del proveedor al pasar el ratón (accesibilidad).

**Solo login — sin registro, sin redes sociales** (panel de admin, intranet...):

> `showRegister` y `socialProviders` son independientes. Para un admin donde
> el único usuario se crea a mano en BD, desactiva ambos.

```html
<lib-login
  title="Panel de administración"
  [showRegister]="false"
  [socialProviders]="[]"
  forgotPasswordUrl=""
  (loginSuccess)="onAdminLogin($event)"
/>
```

**Solo login con redes sociales, sin registro** (app de solo lectura con OAuth):
```html
<lib-login
  [showRegister]="false"
  [socialProviders]="[GOOGLE('/api/auth/google')]"
  (loginSuccess)="onLogin($event)"
/>
```

**Solo registro** (onboarding, invitación):
```html
<lib-login
  initialMode="register"
  [showRegister]="false"
  (registerSuccess)="onRegistro($event)"
/>
```

---

#### Ejemplo básico

```typescript
import { LoginComponent, GOOGLE, GITHUB, TWITTER } from '@adrianmartincano/ng-auth';

@Component({
  imports: [LoginComponent],
  template: `
    <lib-login
      title="Bienvenido a MiApp"
      logoText="MiApp"
      [socialProviders]="sociales"
      (loginSuccess)="onLogin($event)"
      (registerSuccess)="onRegistro($event)"
    />
  `
})
export class LoginPageComponent {
  sociales = [
    GOOGLE('/api/auth/google'),
    GITHUB('/api/auth/github'),
    TWITTER('/api/auth/twitter'),
  ];

  onLogin(res: AuthResponse): void {
    // AuthService ya guardó el token automáticamente
    this.router.navigate(['/dashboard']);
  }

  onRegistro(res: AuthResponse): void {
    this.router.navigate(['/bienvenida']);
  }
}
```

#### Ruta protegida con el componente

```typescript
// app.routes.ts
{
  path: 'login',
  loadComponent: () => import('./pages/login.page').then(m => m.LoginPageComponent),
  canActivate: [guestGuard],  // si ya está logueado, redirige al home
}
```

---

### `<lib-google-button>` — Entrar con Google

Botón de «continuar con Google» con **Google Identity Services**: el token llega por POST sin
salir de la página. Es la pareja de `spring-google` en el backend.

```html
<lib-google-button
  (loginSuccess)="router.navigate(['/mi-cuenta'])"
  (loginError)="console.warn($event)"
/>
```

Eso es todo. El componente hace el viaje entero: pregunta al backend si hay login con Google,
carga la librería de Google solo si la hay, consigue el `id_token`, lo canjea por una sesión
con `AuthService.loginWithGoogle()` y emite `loginSuccess` **con la sesión ya abierta** — el
token guardado e `isLoggedIn()` en `true`. Quien lo usa solo decide a dónde navegar.

#### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `label` | `string` | `'Continuar con Google'` | Texto del botón |
| `showDivider` | `boolean` | `true` | El «o» de separación. Quítalo si tu pantalla ya trae uno |
| `dividerLabel` | `string` | `'o'` | Texto del separador |
| `theme` | `'light' \| 'dark'` | `'light'` | Con qué tema se le pide el widget a Google. Se ve poco: va tapado |
| `errorLabel` | `string` | — | Qué se enseña si Google no carga o el backend rechaza el token |
| `exchange` | `boolean` | `true` | Si canjea el token por una sesión. **A `false` si tu web no usa el `AuthService` de esta librería** |

#### Outputs

| Output | Tipo | Cuándo |
|---|---|---|
| `loginSuccess` | `AuthResponse` | Sesión abierta y guardada (solo con `exchange = true`) |
| `loginError` | `string` | Google no cargó, o el backend rechazó el token. El mensaje ya se enseña dentro |
| `credential` | `string` | Solo con `exchange = false`: el `id_token`, para que lo canjees tú |

#### Si tu web tiene su propio servicio de sesión

Pon `exchange` a `false`. El botón se limita entonces a lo que solo él puede hacer —hablar con
Google y conseguir el `id_token`— y te lo entrega:

```html
<lib-google-button [exchange]="false" (credential)="miAuth.entrarConGoogle($event)" />
```

**No lo dejes en `true` en ese caso.** El botón guardaría la sesión en el `AuthService` de la
librería mientras tu web la guarda en el suyo: dos sesiones en el `localStorage`, y tu
`logout()` borrando solo una — un JWT válido abandonado en el navegador de quien creía haber
salido.

#### Si no hay Google, no aparece nada

El componente pregunta a `/api/auth/google/config`. Cuando `spring-google` está apagado ese
endpoint **no existe y responde 404**, y eso se lee como «aquí no hay login con Google»: no se
pinta nada, no se carga el script y la pantalla sigue funcionando con correo y contraseña.

**El script de Google no va en el `index.html`** a propósito: así solo se descarga si de verdad
hay login con Google configurado, y quien nunca abre la pantalla de entrar no le pide nada a
Google.

#### Esto no es `GOOGLE()` de proveedores sociales

Son **dos flujos distintos** y no se mezclan:

| | `<lib-google-button>` | `GOOGLE('/api/auth/google')` |
|---|---|---|
| Flujo | Google Identity Services: token por POST | Redirección a un endpoint OAuth tuyo |
| Backend | `spring-google` | Lo montas tú |
| La página | No se abandona | Se sale y se vuelve |

Si usas `spring-google`, el componente. `GOOGLE()` se queda para quien ya tenga la redirección
montada, o para Google con otros scopes (YouTube).

#### Lo que hay que configurar fuera del código

- **Consola de Google**: un cliente OAuth **por dominio**. Sin revisión de Google si los
  permisos son `openid email profile`.
- **La CSP**: `script-src`, `frame-src` y `connect-src` con `accounts.google.com`. Si falta
  uno, **el botón no aparece y el error de consola no dice cuál**.

#### Por qué el botón lleva dos capas

Google solo entrega el token a través de **su** widget, y ese widget no se puede estilar:
cuando detecta sesión de Google lo dibuja dentro de un `iframe` de otro origen, con fondo
blanco, que en modo oscuro se ve como un marco. Tampoco vale recortarlo, porque cambia de
tamaño según haya sesión y según lo largo que sea cada nombre.

Lo que se hace es pintar debajo un botón propio y dejar el de Google encima con opacidad 0
para que se lleve el clic. Es fiable porque **el ancho se lo pedimos nosotros**: se le pasa el
que mide el botón visible, así que siempre lo cubre. De ahí el tope de **400 px** del
envoltorio — Google no admite más, y un botón más ancho tendría extremos que no responden.

> Si tocas ese CSS, **pruébalo con sesión de Google iniciada y sin ella**: son dos caminos de
> renderizado distintos (iframe y HTML normal).

---

### Proveedores sociales predefinidos

Helpers que generan la configuración de cada proveedor. Solo necesitas la URL del endpoint OAuth de tu backend.

```typescript
import { GOOGLE, YOUTUBE, GITHUB, TWITTER, FACEBOOK, APPLE, MICROSOFT } from '@adrianmartincano/ng-auth';

socialProviders = [
  GOOGLE('/api/auth/google'),                              // estándar
  GOOGLE('/api/auth/google', 'Mi empresa con Google'),     // label personalizado
  YOUTUBE('/api/auth/google'),   // Google OAuth con scopes de YouTube
  GITHUB('/api/auth/github'),
  TWITTER('/api/auth/twitter'),
  FACEBOOK('/api/auth/facebook'),
  APPLE('/api/auth/apple'),
  MICROSOFT('/api/auth/microsoft'),
];
```

> **Nota YouTube:** YouTube no tiene OAuth independiente — usa Google OAuth con los scopes de YouTube configurados en el backend. `YOUTUBE()` apunta al mismo endpoint de Google pero con branding rojo.

#### Proveedor personalizado

```typescript
import { SocialProvider } from '@adrianmartincano/ng-models';

const miProveedor: SocialProvider = {
  id: 'instagram',
  label: 'Continuar con Instagram',
  url: '/api/auth/instagram',
  bgColor: '#e1306c',
  textColor: '#ffffff',
  icon: '<svg>...</svg>',   // SVG inline como string
};
```

---

### `AuthService` — Gestión del token y sesión

```typescript
readonly auth = inject(AuthService);

// Signals (reactivos)
auth.isLoggedIn()    // boolean
auth.token()         // string | null
auth.currentUser()   // AuthUser | null

// Métodos
auth.login({ email, password })         // Observable<AuthResponse>
auth.register({ name, email, password }) // Observable<AuthResponse>
auth.logout()
auth.hasRole('admin')
auth.hasAnyRole('admin', 'editor')
auth.setSession(response)  // para OAuth: llama esto cuando el backend devuelva el JWT

auth.loginWithGoogle(credential)  // canjea el id_token de Google por una sesión
```

`loginWithGoogle()` normaliza la respuesta igual que `login()` y deja la sesión abierta: al
resto de la aplicación le da igual por dónde haya entrado cada cual. Normalmente **no hace
falta llamarlo a mano** — lo hace `<lib-google-button>`. Y `logout()` avisa a Google para que
vuelva a preguntar la próxima vez, en vez de reentrar solo en un ordenador compartido.

El token y usuario se guardan en `localStorage` automáticamente y se restauran al recargar la página. Compatible con SSR.

#### Configurar endpoints

```typescript
// En tu app.component o app.config
inject(AuthService).configure({
  loginEndpoint:    '/api/v1/auth/login',
  registerEndpoint: '/api/v1/auth/register',
  tokenKey:         'mi_app_token',
  // Si tu API está en otro dominio/puerto, decláralo aquí para que el interceptor
  // le adjunte el token (a terceros nunca se les envía). Ver sección Interceptor.
  trustedOrigins:   ['http://localhost:8080'],
  // Solo si moviste los de spring-google de su sitio:
  googleEndpoint:       '/api/v1/auth/google',
  googleConfigEndpoint: '/api/v1/auth/google/config',
});
```

> **Caducidad:** al arrancar, `AuthService` descarta un JWT ya caducado (no arranca "logueado"
> con un token muerto). `isTokenExpired()` está disponible si lo necesitas.

---

### Guards — Proteger rutas

```typescript
import { authGuard, guestGuard, roleGuard, anyRoleGuard } from '@adrianmartincano/ng-auth';

export const routes: Routes = [
  { path: 'login',     component: LoginPage,     canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
  { path: 'admin',     component: AdminPage,     canActivate: [roleGuard('admin')] },
  { path: 'editor',    component: EditorPage,    canActivate: [anyRoleGuard('admin', 'editor')] },
];
```

| Guard | Comportamiento |
|---|---|
| `authGuard` | Redirige a `/login` si no está autenticado |
| `guestGuard` | Redirige a `/` si ya está autenticado |
| `roleGuard('admin')` | Redirige a `/no-autorizado` si no tiene el rol |
| `anyRoleGuard('admin', 'editor')` | Permite si tiene CUALQUIERA de los roles |

---

### Interceptor — Añadir token a las peticiones HTTP

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@adrianmartincano/ng-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

A partir de ahí, las peticiones a **tu backend** llevan automáticamente:
```
Authorization: Bearer eyJhbGciOi...
```

> **Seguridad — a quién se le envía el token.** El interceptor solo adjunta el token a:
> rutas **relativas** (`/api/...`), peticiones del **mismo origen** y los **`trustedOrigins`**
> que configures. A cualquier otro dominio (APIs de terceros, analítica, mapas…) **no** se le
> envía el token, para no filtrarlo fuera de tu backend.
>
> Si tu API vive en otro origen (p. ej. `http://localhost:8080` en desarrollo, o
> `https://api.midominio.com`), **debes** añadirlo a `trustedOrigins` (ver *Configurar endpoints*)
> o el token no se adjuntará a esas llamadas.

---

### Flujo OAuth social completo

```
Usuario clic "Google"
  → onSocialClick() emite el provider
  → window.location.href = '/api/auth/google'
  → Backend redirige a Google
  → Google autentica y redirige a /api/auth/google/callback
  → Backend genera JWT y redirige al frontend con el token
  → Frontend recibe el token y llama auth.setSession(response)
```

En el frontend, la página de callback:

```typescript
@Component({ template: '' })
export class AuthCallbackComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    const user  = JSON.parse(this.route.snapshot.queryParams['user'] ?? '{}');
    if (token) {
      this.auth.setSession({ token, user });
      this.router.navigate(['/dashboard']);
    }
  }
}
```

---

