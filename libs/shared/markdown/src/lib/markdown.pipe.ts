import { Pipe, PipeTransform } from '@angular/core';
import { looksLikeHtml, renderMarkdown, stripMarkdown } from './markdown-parser';

/**
 * Convierte markdown reducido en HTML. Pensado para `[innerHTML]`:
 *
 * ```html
 * <div class="fp__body" [innerHTML]="post.body | libMarkdown"></div>
 * ```
 *
 * Devuelve `string`, no `SafeHtml`, para que Angular sanitice el resultado
 * además del escapado que ya hace el parser.
 */
@Pipe({ name: 'libMarkdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return renderMarkdown(value);
  }
}

/**
 * Como `libMarkdown`, pero deja pasar tal cual el contenido que ya venía escrito
 * en HTML. Para campos con historia: el cuerpo de los posts del blog se redactó
 * en HTML antes de que existiera el markdown, y con `libMarkdown` a secas esas
 * entradas mostrarían sus etiquetas escapadas.
 *
 * Solo para contenido de confianza (lo escribe un administrador). Para texto del
 * público usa siempre `libMarkdown`, que escapa el HTML sin excepciones.
 */
@Pipe({ name: 'libMarkdownOrHtml' })
export class MarkdownOrHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return looksLikeHtml(value) ? value : renderMarkdown(value);
  }
}

/**
 * Quita las marcas y deja texto plano. Para adelantos (citas, "último mensaje",
 * excerpts), donde no quieres pintar HTML pero tampoco enseñar los asteriscos.
 */
@Pipe({ name: 'libStripMarkdown' })
export class StripMarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return stripMarkdown(value);
  }
}
