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
```

El token y usuario se guardan en `localStorage` automáticamente y se restauran al recargar la página. Compatible con SSR.

#### Configurar endpoints

```typescript
// En tu app.component o app.config
inject(AuthService).configure({
  loginEndpoint:    '/api/v1/auth/login',
  registerEndpoint: '/api/v1/auth/register',
  tokenKey:         'mi_app_token',
});
```

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

A partir de ahí, todas las peticiones HTTP llevan automáticamente:
```
Authorization: Bearer eyJhbGciOi...
```

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

