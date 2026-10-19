# @adrianmartincano/ng-blog

Blog para Angular 21. Componentes standalone que consumen la API del módulo backend
[`spring-blog`](https://github.com/AdrianMartinCano/libreriasBackend): feed de posts,
detalle con comentarios y panel de administración.

Las rutas de la API son relativas (`/api/blog/**`); el JWT lo añade el interceptor de
`@adrianmartincano/ng-auth`. El look se hereda de `@adrianmartincano/ng-theme`.

## Instalación

```bash
npm install @adrianmartincano/ng-blog
```

## Componentes

| Componente | Selector | Para qué |
|---|---|---|
| `BlogFeedComponent` | `lib-blog-feed` | Listado de posts publicados (con "cargar más") |
| `BlogPostComponent` | `lib-blog-post` | Detalle de un post + comentarios de usuarios registrados |
| `BlogAdminComponent` | `lib-blog-admin` | Admin: crear/editar/borrar posts, subir portada, moderar comentarios |

Todos son **standalone** y `OnPush`. Emiten `postClick` (slug) y `requireLogin` para que
la app decida la navegación.

## Formato del contenido

Tanto el **cuerpo de las entradas** como los **comentarios** se escriben con
**markdown reducido** (negrita, cursiva, subrayado, tachado, código, enlaces, citas y
listas) más emojis, mediante
[`@adrianmartincano/ng-markdown`](../markdown/README.md), que es **peer dependency**.
`lib-blog-admin` y `lib-blog-post` usan su `lib-markdown-editor` para escribir.

Lo que se guarda es el markdown en crudo: el módulo `spring-blog` no cambia.

Para que se vea con formato hace falta el CSS de `@adrianmartincano/ng-theme` (la clase
`.lib-md` vive ahí).

### Entradas antiguas escritas en HTML

Antes, el cuerpo de las entradas lo escribía el administrador directamente en HTML. Esas
entradas **se siguen viendo igual, sin migrar nada**: `lib-blog-post` las pinta con el
pipe `libMarkdownOrHtml`, que detecta el HTML y lo deja pasar tal cual en vez de escapar
las etiquetas.

En `lib-blog-admin`, al abrir una de esas entradas aparece un aviso: se sigue publicando
como HTML mientras no se reescriba con los botones de formato. En cuanto se reescribe,
pasa a markdown como cualquier entrada nueva. No hay fecha límite ni migración pendiente.

Los **comentarios** nunca pasan por ahí: son texto del público y su HTML se escapa
siempre, sin excepciones.

## BlogService

Cliente HTTP de la API del blog (listado, detalle, comentarios, subida de imágenes y
endpoints de admin). Inyectable en `providedIn: 'root'`.

## Notas

- **Nick en vivo**: los comentarios muestran el nick actual del perfil, resuelto en el
  back (bean `CommentAuthorNameResolver` en la app).
- Distintivo **★ Admin** en los comentarios escritos por un administrador.
