import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { MarkdownOrHtmlPipe, MarkdownPipe } from '../markdown.pipe';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

/** Botón que envuelve la selección con una marca (negrita, cursiva…). */
interface InlineButton {
  label: string;
  title: string;
  /** Marca que se pone delante y detrás de lo seleccionado. */
  marker: string;
  /** Clase extra para que el botón se vea como lo que hace. */
  css: string;
}

/** Botón que prefija las líneas seleccionadas (cita, lista). */
interface BlockButton {
  label: string;
  title: string;
  prefix: string;
}

const INLINE_BUTTONS: readonly InlineButton[] = [
  { label: 'B', title: 'Negrita (Ctrl+B)', marker: '**', css: 'lib-mde__btn--b' },
  { label: 'I', title: 'Cursiva (Ctrl+I)', marker: '*', css: 'lib-mde__btn--i' },
  { label: 'U', title: 'Subrayado (Ctrl+U)', marker: '__', css: 'lib-mde__btn--u' },
  { label: 'S', title: 'Tachado', marker: '~~', css: 'lib-mde__btn--s' },
  { label: '</>', title: 'Código', marker: '`', css: 'lib-mde__btn--code' },
];

const BLOCK_BUTTONS: readonly BlockButton[] = [
  { label: '❝', title: 'Cita', prefix: '> ' },
  { label: '☰', title: 'Lista', prefix: '- ' },
];

/**
 * Textarea con barra de formato. Escribe y devuelve **markdown reducido** (el
 * mismo que entiende `libMarkdown`), nunca HTML: lo que se guarda en la base de
 * datos sigue siendo texto plano legible.
 *
 * ```html
 * <lib-markdown-editor [(value)]="draft" [maxlength]="20000" rows="4"
 *                      placeholder="Escribe tu respuesta…" />
 * ```
 *
 * Los botones actúan sobre la selección: si seleccionas texto y pulsas **B**,
 * se envuelve; si vuelves a pulsarlo con lo mismo seleccionado, se quita. Sin
 * selección, inserta las marcas y deja el cursor en medio.
 */
@Component({
  selector: 'lib-markdown-editor',
  imports: [MarkdownPipe, MarkdownOrHtmlPipe, EmojiPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-mde">
      <div class="lib-mde__bar" role="toolbar" aria-label="Formato del texto">
        @for (b of inlineButtons; track b.marker) {
          <button
            type="button"
            class="lib-mde__btn"
            [class]="b.css"
            [title]="b.title"
            [attr.aria-label]="b.title"
            [disabled]="disabled() || previewing()"
            (click)="wrap(b.marker)"
          >{{ b.label }}</button>
        }
        <span class="lib-mde__sep" aria-hidden="true"></span>
        @for (b of blockButtons; track b.prefix) {
          <button
            type="button"
            class="lib-mde__btn"
            [title]="b.title"
            [attr.aria-label]="b.title"
            [disabled]="disabled() || previewing()"
            (click)="toggleLinePrefix(b.prefix)"
          >{{ b.label }}</button>
        }
        <button
          type="button"
          class="lib-mde__btn"
          title="Enlace"
          aria-label="Enlace"
          [disabled]="disabled() || previewing()"
          (click)="insertLink()"
        >🔗</button>
        <div class="lib-mde__emoji-wrap">
          <button
            type="button"
            class="lib-mde__btn"
            title="Emoji"
            aria-label="Emoji"
            [attr.aria-expanded]="emojiOpen()"
            [disabled]="disabled() || previewing()"
            (click)="emojiOpen.set(!emojiOpen())"
          >🙂</button>
          @if (emojiOpen()) {
            <div class="lib-mde__emoji-pop">
              <lib-emoji-picker (pick)="insertEmoji($event)" />
            </div>
          }
        </div>
        <span class="lib-mde__spacer"></span>
        <button
          type="button"
          class="lib-mde__btn lib-mde__btn--wide"
          [disabled]="disabled()"
          [attr.aria-pressed]="previewing()"
          (click)="previewing.set(!previewing())"
        >{{ previewing() ? 'Editar' : 'Vista previa' }}</button>
      </div>

      @if (previewing()) {
        @if (allowLegacyHtml()) {
          <div class="lib-mde__preview lib-md" [innerHTML]="value() | libMarkdownOrHtml"></div>
        } @else {
          <div class="lib-mde__preview lib-md" [innerHTML]="value() | libMarkdown"></div>
        }
      } @else {
        <textarea
          #area
          class="lib-mde__area"
          [rows]="rows()"
          [attr.maxlength]="maxlength() > 0 ? maxlength() : null"
          [attr.aria-label]="ariaLabel()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
        ></textarea>
      }

      @if (maxlength() > 0) {
        <span class="lib-mde__count" [class.lib-mde__count--full]="remaining() < 0">
          {{ value().length }}/{{ maxlength() }}
        </span>
      }
    </div>
  `,
  styles: [
    `
      .lib-mde { display: flex; flex-direction: column; gap: 0.4rem; }
      .lib-mde__bar {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        flex-wrap: wrap;
      }
      .lib-mde__btn {
        min-width: 1.9rem;
        height: 1.9rem;
        padding: 0 0.4rem;
        background: transparent;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: var(--radius-sm, 4px);
        color: var(--color-text, #1a1a1a);
        font-size: 0.85rem;
        line-height: 1;
        cursor: pointer;
      }
      .lib-mde__btn:hover:not(:disabled) { background: rgb(0 0 0 / 0.06); }
      .lib-mde__btn:disabled { opacity: 0.45; cursor: default; }
      .lib-mde__btn:focus-visible {
        outline: 2px solid var(--color-accent, #a87f3e);
        outline-offset: 1px;
      }
      .lib-mde__btn--wide { width: auto; padding: 0 0.7rem; }
      .lib-mde__btn--b { font-weight: 800; }
      .lib-mde__btn--i { font-style: italic; font-family: serif; }
      .lib-mde__btn--u { text-decoration: underline; }
      .lib-mde__btn--s { text-decoration: line-through; }
      .lib-mde__btn--code { font-family: var(--font-mono, monospace); font-size: 0.7rem; }
      .lib-mde__sep {
        width: 1px;
        height: 1.2rem;
        margin: 0 0.25rem;
        background: var(--color-border, #cdbf9f);
      }
      .lib-mde__spacer { flex: 1; }
      .lib-mde__emoji-wrap { position: relative; }
      .lib-mde__emoji-pop { position: absolute; z-index: 20; top: calc(100% + 0.3rem); left: 0; }
      /*
        Tamaño fijo, con scroll cuando el texto no cabe.
        Llevaba «resize: vertical», que pinta el agarrador de rayitas en la esquina. Eso
        enseña un adorno del navegador en medio de una web cuidada, y al estirarlo rompe el
        hueco donde vive: en un comentario del blog empuja el resto de la página, y en el
        foro descoloca los mensajes de debajo. El alto lo manda «rows», que cada pantalla
        ya fija a lo que le conviene.
      */
      .lib-mde__area {
        width: 100%;
        padding: 0.7rem;
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: var(--radius-sm, 4px);
        font: inherit;
        resize: none;
        overflow-y: auto;
      }
      .lib-mde__preview {
        min-height: 4rem;
        padding: 0.7rem;
        border: 1px dashed var(--color-border, #cdbf9f);
        border-radius: var(--radius-sm, 4px);
        background: rgb(0 0 0 / 0.02);
      }
      .lib-mde__count {
        align-self: flex-end;
        font-size: 0.78rem;
        color: var(--color-text-muted, #8a7f6d);
      }
      .lib-mde__count--full { color: var(--color-danger, #b14b43); }
    `,
  ],
})
export class MarkdownEditorComponent {
  /** Markdown en crudo. Doble binding: `[(value)]="draft"`. */
  readonly value = model<string>('');
  readonly rows = input(4);
  readonly placeholder = input('');
  /** 0 = sin límite. Si es > 0 se pinta el contador. */
  readonly maxlength = input(0);
  readonly disabled = input(false);
  readonly ariaLabel = input('Mensaje');
  /**
   * Si el contenido ya venía escrito en HTML, respetarlo en la vista previa en
   * vez de escapar las etiquetas. Solo para campos de administrador con
   * historia (el cuerpo de los posts del blog); jamás para texto del público.
   */
  readonly allowLegacyHtml = input(false);

  readonly previewing = signal(false);
  readonly emojiOpen = signal(false);

  readonly inlineButtons = INLINE_BUTTONS;
  readonly blockButtons = BLOCK_BUTTONS;

  readonly remaining = computed(() => this.maxlength() - this.value().length);

  private readonly area = viewChild<ElementRef<HTMLTextAreaElement>>('area');

  onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const marker = { b: '**', i: '*', u: '__' }[event.key.toLowerCase()];
    if (!marker) return;
    event.preventDefault();
    this.wrap(marker);
  }

  /**
   * Envuelve la selección con `marker`, o se la quita si ya la tiene (mire las
   * marcas dentro o justo fuera de lo seleccionado). Sin selección, inserta las
   * dos marcas y deja el cursor en medio para seguir escribiendo.
   */
  wrap(marker: string): void {
    const el = this.area()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const len = marker.length;

    // Marcas dentro de la selección: "**hola**" seleccionado entero
    if (end - start >= len * 2 && text.slice(start, start + len) === marker && text.slice(end - len, end) === marker) {
      const inner = text.slice(start + len, end - len);
      this.replaceRange(start, end, inner, start, start + inner.length);
      return;
    }

    // Marcas fuera de la selección: "**|hola|**" con solo "hola" seleccionado
    if (start >= len && text.slice(start - len, start) === marker && text.slice(end, end + len) === marker) {
      const inner = text.slice(start, end);
      this.replaceRange(start - len, end + len, inner, start - len, start - len + inner.length);
      return;
    }

    const selected = text.slice(start, end);
    this.replaceRange(start, end, marker + selected + marker, start + len, start + len + selected.length);
  }

  /**
   * Pone (o quita) `prefix` al principio de cada línea tocada por la selección.
   * Es lo que da las sangrías: la cita y la lista se ven indentadas al pintarse.
   */
  toggleLinePrefix(prefix: string): void {
    const el = this.area()?.nativeElement;
    if (!el) return;
    const text = el.value;
    const lineStart = text.lastIndexOf('\n', Math.max(0, el.selectionStart - 1)) + 1;
    const nextBreak = text.indexOf('\n', el.selectionEnd);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;

    const lines = text.slice(lineStart, lineEnd).split('\n');
    const allPrefixed = lines.every((l) => l.startsWith(prefix));
    const next = lines
      .map((l) => (allPrefixed ? l.slice(prefix.length) : prefix + l))
      .join('\n');

    this.replaceRange(lineStart, lineEnd, next, lineStart, lineStart + next.length);
  }

  /** Inserta `[texto](url)`. Si lo seleccionado ya es una url, la reutiliza. */
  insertLink(): void {
    const el = this.area()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end).trim();
    const isUrl = /^https?:\/\//i.test(selected);

    const url = (prompt('Dirección del enlace', isUrl ? selected : 'https://') ?? '').trim();
    if (!url || url === 'https://') return;

    const label = selected && !isUrl ? selected : 'texto del enlace';
    // Se deja el texto seleccionado para poder reescribirlo de un tirón
    this.replaceRange(start, end, `[${label}](${url})`, start + 1, start + 1 + label.length);
  }

  insertEmoji(emoji: string): void {
    const el = this.area()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    this.replaceRange(start, end, emoji, start + emoji.length, start + emoji.length);
    this.emojiOpen.set(false);
  }

  /**
   * Sustituye un trozo del textarea y recoloca el cursor.
   *
   * Usa `execCommand('insertText')` —sí, está deprecado— porque es la única
   * forma de que el cambio entre en la pila de deshacer del navegador: sin él,
   * un Ctrl+Z después de pulsar un botón se come todo lo escrito. Si el navegador
   * no lo soporta, se escribe el valor a mano (se pierde el undo, no el texto).
   */
  private replaceRange(
    start: number,
    end: number,
    text: string,
    selectionStart: number,
    selectionEnd: number,
  ): void {
    const el = this.area()?.nativeElement;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);

    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch {
      inserted = false;
    }
    if (!inserted) {
      el.value = el.value.slice(0, start) + text + el.value.slice(end);
    }

    el.setSelectionRange(selectionStart, selectionEnd);
    this.value.set(el.value);
  }
}
