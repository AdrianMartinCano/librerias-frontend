# @adrianmartincano/ng-forum

Foro de comunidad para Angular 21. Componentes standalone que consumen la API del
módulo backend [`spring-forum`](https://github.com/AdrianMartinCano/libreriasBackend):
categorías, hilos y mensajes, reacciones, citas, notificaciones, búsqueda y moderación.

Las rutas de la API son relativas (`/api/forum/**`); el JWT lo añade el interceptor de
`@adrianmartincano/ng-auth` de la app. El look se hereda de `@adrianmartincano/ng-theme`
(variables CSS `--color-*`).

## Instalación

```bash
npm install @adrianmartincano/ng-forum
```

Requiere `@adrianmartincano/ng-theme` (peer) y un interceptor que adjunte el JWT.

## Componentes

| Componente | Selector | Para qué |
|---|---|---|
| `ForumCategoriesComponent` | `lib-forum-categories` | Portada: lista de categorías con contadores |
| `ForumThreadsComponent` | `lib-forum-threads` | Hilos de una categoría + abrir tema |
| `ForumThreadComponent` | `lib-forum-thread` | Detalle de un hilo: mensajes, responder, citar, reaccionar, editar/borrar, denunciar, moderar |
| `ForumNotificationsComponent` | `lib-forum-notifications` | Bandeja de notificaciones del usuario |
| `ForumAdminComponent` | `lib-forum-admin` | Admin: gestión de categorías y cola de denuncias |

Todos son **standalone** y `OnPush`. Emiten eventos de navegación (`categoryClick`,
`threadClick`, `open`, `openThread`) y `requireLogin` para que la app decida la ruta;
no dependen del Router.

### Inputs principales de `lib-forum-thread`

| Input | Tipo | Descripción |
|---|---|---|
| `slug` | `string` (req.) | Hilo a cargar |
| `loggedIn` | `boolean` | Si el visitante puede participar |
| `currentUserId` | `string` | Id del usuario (para saber qué mensajes son suyos; `''` = anónimo) |
| `canModerate` | `boolean` | Si es admin (fijar/cerrar/borrar de cualquiera) |
| `editWindowMinutes` | `number` | Minutos para editar el propio mensaje (0 = sin límite). Debe coincidir con `pimon.forum.edit-window-minutes` del back |

## Ejemplo

```ts
import { ForumThreadComponent } from '@adrianmartincano/ng-forum';

@Component({
  imports: [ForumThreadComponent],
  template: `
    <lib-forum-thread
      [slug]="slug()"
      [loggedIn]="auth.isLoggedIn()"
      [currentUserId]="auth.currentUser()?.id ?? ''"
      [canModerate]="auth.hasRole('ROLE_ADMIN')"
      (requireLogin)="goToLogin()"
      (threadGone)="goToForum()" />
  `,
})
export class ThreadPage { /* ... */ }
```

## Formato de los mensajes

Los mensajes se escriben con **markdown reducido** (negrita, cursiva, subrayado,
tachado, código, enlaces, citas y listas) más emojis. Lo pone
[`@adrianmartincano/ng-markdown`](../markdown/README.md), que es **peer dependency**:
`lib-forum-threads` y `lib-forum-thread` usan su `lib-markdown-editor` para escribir y
su pipe `libMarkdown` para pintar.

Lo que viaja al backend y se guarda en la base de datos sigue siendo **texto plano**
(el markdown en crudo), así que el módulo `spring-forum` no necesita ningún cambio.

Para que el contenido se vea con formato, la app debe cargar el CSS de
`@adrianmartincano/ng-theme`: los estilos del markdown renderizado (`.lib-md`) viven
ahí, porque el HTML inyectado con `[innerHTML]` no recibe la encapsulación de Angular.

## ForumService

Cliente HTTP de toda la API (categorías, hilos, mensajes, reacciones, denuncias,
búsqueda, notificaciones y endpoints de admin). Inyectable en `providedIn: 'root'`.

## Notas

- El **nick en vivo**: los mensajes muestran el nick actual del perfil; lo resuelve el
  back (bean `ForumAuthorNameResolver` en la app). El cliente no puede falsearlo.
- Por la config de build de las librerías (sin `strictNullChecks`), los inputs opcionales
  nullable se publican como su tipo base — por eso `currentUserId` es `string` (usa `''`
  para "anónimo"), no `string | null`.
