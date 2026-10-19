# @adrianmartincano/ng-markdown

Formato de texto para contenido que escribe el público (mensajes de foro,
comentarios de blog): un **markdown reducido** con barra de botones, selector de
emojis y vista previa.

Lo que se guarda en la base de datos es **markdown en crudo**, nunca HTML. El
backend no necesita cambios ni sanitizadores: sigue recibiendo y devolviendo el
mismo `String` de siempre.

## Instalación

```bash
npm install @adrianmartincano/ng-markdown
```

Requiere `@adrianmartincano/ng-theme` (peer): de ahí salen las variables CSS y,
sobre todo, la clase global `.lib-md` que da estilo al contenido renderizado.

## Sintaxis soportada

| Marca | Resultado | Botón |
|---|---|---|
| `**texto**` | **negrita** | B (Ctrl+B) |
| `*texto*` | *cursiva* | I (Ctrl+I) |
| `__texto__` | subrayado | U (Ctrl+U) |
| `~~texto~~` | tachado | S |
| `` `texto` `` | código | `</>` |
| `[texto](url)` | enlace | 🔗 |
| `> texto` | cita (sangrada) | ❝ |
| `- texto` | lista (sangrada) | ☰ |
| `1. texto` | lista numerada | — |

Y nada más: es un subconjunto **cerrado** a propósito. Sin imágenes, sin tablas,
sin HTML embebido.

> **Ojo con `__`:** en markdown estándar es negrita; aquí es **subrayado**,
> porque es lo que genera el botón U y el usuario final no escribe markdown a
> mano. Si algún día se pega markdown traído de fuera, esa es la única marca que
> se interpreta distinto.

Los **emojis** son Unicode normal y corriente: se guardan tal cual en el texto.
El selector es solo comodidad. En MySQL/MariaDB la columna debe ser `utf8mb4`
(el `utf8` de MySQL son 3 bytes y se come los emojis); en PostgreSQL no hay nada
que hacer.

## Uso

### Editar

```html
<lib-markdown-editor
  [(value)]="draft"
  [rows]="4"
  [maxlength]="20000"
  placeholder="Escribe tu respuesta…"
  ariaLabel="Tu respuesta"
  [disabled]="sending()" />
```

`value` es un `model()`: se enlaza contra un `signal<string>` con `[(value)]`.
Devuelve markdown en crudo, listo para mandar al backend sin tocarlo.

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `value` | `string` (model) | `''` | Markdown en crudo, doble binding |
| `rows` | `number` | `4` | Alto inicial del textarea |
| `maxlength` | `number` | `0` | Límite; si es > 0 se pinta el contador |
| `placeholder` | `string` | `''` | Texto de ayuda |
| `disabled` | `boolean` | `false` | Bloquea barra y textarea |
| `ariaLabel` | `string` | `'Mensaje'` | Nombre accesible del textarea |
| `allowLegacyHtml` | `boolean` | `false` | La vista previa respeta el HTML antiguo en vez de escaparlo |

**Cómo se comportan los botones:** con texto seleccionado, lo envuelven; si lo
seleccionado ya tiene ese formato, se lo quitan. Sin selección, insertan las dos
marcas y dejan el cursor en medio. La cita y la lista actúan sobre las líneas
enteras que toque la selección.

Los cambios entran en la pila de **deshacer** del navegador (Ctrl+Z funciona
igual que si lo hubieras escrito a mano), porque la inserción usa
`document.execCommand('insertText')`. Está deprecado y no hay alternativa: la
API moderna no existe. Si un navegador dejara de soportarlo hay respaldo, y lo
único que se pierde es el undo, no el texto.

### Pintar

```html
<div class="fp__body lib-md" [innerHTML]="post.body | libMarkdown"></div>
```

La clase **`.lib-md` es obligatoria**: los estilos del contenido (negrita,
citas, listas…) viven en el CSS global de `ng-theme`, no en esta lib. El HTML
que entra por `[innerHTML]` no recibe los atributos de encapsulación de Angular,
así que los `styles` de un componente nunca le llegarían.

Para adelantos (citas, "último mensaje", excerpts) donde no quieres HTML pero
tampoco enseñar los asteriscos:

```html
<span>{{ post.body | libStripMarkdown }}</span>
```

### Campos con historia: `libMarkdownOrHtml`

Si un campo ya tenía contenido escrito **en HTML** antes de que existiera el
markdown (el caso del cuerpo de los posts del blog), `libMarkdown` a secas
escaparía esas etiquetas y el lector vería `<p>Hola</p>` en mitad del texto.

```html
<div class="bp__body lib-md" [innerHTML]="post.body | libMarkdownOrHtml"></div>
```

Este pipe detecta el HTML antiguo (`looksLikeHtml`) y lo deja pasar tal cual; lo
demás lo trata como markdown. Así las entradas viejas se ven exactamente igual
que siempre y las nuevas se escriben con la barra de botones, **sin migrar nada**.

> **Solo para contenido de confianza** (lo escribe un administrador). Para texto
> del público usa siempre `libMarkdown`, que escapa el HTML sin excepciones.

En el editor, `[allowLegacyHtml]="true"` hace que la **vista previa** respete ese
HTML en vez de escaparlo.

### Fuera de una plantilla

```ts
import { renderMarkdown, stripMarkdown } from '@adrianmartincano/ng-markdown';
```

## Seguridad

Dos redes independientes, a propósito:

1. **El parser escapa cada línea** antes de aplicarle ninguna regla, así que el
   HTML resultante solo puede contener las etiquetas que genera la propia lib.
   Un `<script>` o un `<img onerror=…>` escritos por un usuario salen como texto
   literal. En los enlaces solo se aceptan `http://`, `https://` y `mailto:`.
2. **Angular vuelve a sanitizar** al pintar: los pipes devuelven `string`, no
   `SafeHtml`, y en ningún sitio se llama a `bypassSecurityTrustHtml`.

Esto vale **mientras el markdown se renderice en el navegador**. Si algún día ese
mismo texto se manda por email o lo consume otro cliente, ahí ya no hay Angular
que sanitice: habría que renderizarlo en el backend con un sanitizador (jsoup).
Guardar markdown en crudo en la base de datos —y no HTML— es justo lo que
mantiene esa puerta abierta sin migraciones.

## Componentes

| Componente | Selector | Para qué |
|---|---|---|
| `MarkdownEditorComponent` | `lib-markdown-editor` | Textarea + barra de formato + emojis + vista previa |
| `EmojiPickerComponent` | `lib-emoji-picker` | Solo la paleta de emojis; emite `(pick)` con el emoji |

Ambos son **standalone** y `OnPush`, sin dependencias externas: la lista de
emojis es una selección curada de ~180, no el set completo de Unicode.
