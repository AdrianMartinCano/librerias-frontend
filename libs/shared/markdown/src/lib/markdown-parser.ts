/**
 * Parser de un subconjunto cerrado de markdown, pensado para texto que escribe
 * el público (mensajes de foro, comentarios de blog). No es un markdown
 * completo a propósito: cuanto menos entienda, menos superficie de ataque y
 * menos sorpresas para quien solo quiere poner una palabra en negrita.
 *
 * Sintaxis soportada:
 * | Marca              | Resultado        |
 * |--------------------|------------------|
 * | `**texto**`        | negrita          |
 * | `*texto*`          | cursiva          |
 * | `__texto__`        | subrayado (*)    |
 * | `~~texto~~`        | tachado          |
 * | `` `texto` ``      | código           |
 * | `[texto](url)`     | enlace           |
 * | `> texto`          | cita             |
 * | `- texto`          | lista            |
 * | `1. texto`         | lista numerada   |
 *
 * (*) `__` es negrita en markdown estándar; aquí es subrayado porque la barra de
 * botones lo genera así y el usuario final nunca escribe markdown a mano.
 *
 * Seguridad: cada línea se escapa antes de aplicarle ninguna regla de formato,
 * así que el HTML del resultado solo puede contener las etiquetas que genera
 * este fichero. Aun así el resultado se pinta con `[innerHTML]`, que Angular
 * vuelve a sanitizar: son dos redes independientes, a propósito.
 */

/** Únicos protocolos que se convierten en enlace. */
const ALLOWED_PROTOCOLS = ['http://', 'https://', 'mailto:'];

/** Centinelas de la zona de uso privado: imposibles de teclear en un textarea. */
const TOKEN_OPEN = String.fromCharCode(0xe000);
const TOKEN_CLOSE = String.fromCharCode(0xe001);

/** Escapa el HTML del usuario. Todo lo demás del parser asume que ya se hizo. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Deja pasar solo http/https/mailto. `javascript:` y `data:` se quedan fuera.
 * Angular también los bloquearía, pero preferimos no generar nunca el enlace.
 */
function isSafeUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  return ALLOWED_PROTOCOLS.some((p) => lower.startsWith(p));
}

/**
 * Guarda un fragmento ya renderizado para que las reglas siguientes no lo
 * toquen (p. ej. que el autoenlace no vuelva a mirar dentro de un `href`).
 */
class TokenStore {
  private readonly items: string[] = [];

  keep(html: string): string {
    this.items.push(html);
    return `${TOKEN_OPEN}${this.items.length - 1}${TOKEN_CLOSE}`;
  }

  restore(text: string): string {
    return text.replace(
      new RegExp(`${TOKEN_OPEN}(\\d+)${TOKEN_CLOSE}`, 'g'),
      (whole, index: string) => this.items[Number(index)] ?? whole,
    );
  }
}

/**
 * Escapa la línea y le aplica las marcas que viven dentro. El orden importa: el
 * código se aparta primero (dentro de `código` no se formatea nada) y las tres
 * variantes de asterisco van de más larga a más corta para que `***x***` no se
 * parta por la mitad y salga mal anidado.
 */
function renderInline(line: string, tokens: TokenStore): string {
  let out = escapeHtml(line);

  // `código` — se aparta entero para que ninguna otra regla mire dentro
  out = out.replace(/`([^`\n]+)`/g, (_, code: string) => tokens.keep(`<code>${code}</code>`));

  // [texto](url) — se aparta ya renderizado para que el autoenlace no lo repita
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_whole, label: string, url: string) => {
    // `&amp;` en el href rompería la url: se escapó antes, se devuelve a `&`
    const href = url.replace(/&amp;/g, '&');
    if (!isSafeUrl(href)) return label; // url rara: se queda el texto, sin enlace
    return tokens.keep(
      `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>`,
    );
  });

  out = out
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([\s\S]*?\S)__/g, '<u>$1</u>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>')
    .replace(/\*(?=\S)([^*\n]*?\S)\*/g, '<em>$1</em>');

  // Urls sueltas: la gente las pega tal cual y espera que sean clicables
  out = out.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (url) =>
    tokens.keep(
      `<a href="${url.replace(/&amp;/g, '&')}" target="_blank" rel="noopener noreferrer nofollow">${url}</a>`,
    ),
  );

  return out;
}

/** Qué tipo de bloque abre una línea. */
type BlockKind = 'quote' | 'ul' | 'ol' | 'p';

function kindOf(line: string): BlockKind {
  if (/^\s*>\s?/.test(line)) return 'quote';
  if (/^\s*[-*]\s+/.test(line)) return 'ul';
  if (/^\s*\d+[.)]\s+/.test(line)) return 'ol';
  return 'p';
}

/** Quita la marca de bloque y deja el contenido de la línea. */
function stripMarker(line: string, kind: BlockKind): string {
  switch (kind) {
    case 'quote': return line.replace(/^\s*>\s?/, '');
    case 'ul': return line.replace(/^\s*[-*]\s+/, '');
    case 'ol': return line.replace(/^\s*\d+[.)]\s+/, '');
    case 'p': return line;
  }
}

/**
 * Convierte markdown reducido en HTML. Devuelve un `string` (no un `SafeHtml`)
 * a propósito: quien lo pinte con `[innerHTML]` obtiene la sanitización de
 * Angular encima, y así nadie puede saltársela por usar este parser.
 */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return '';

  const tokens = new TokenStore();
  // Sin escapar todavía: los marcadores de bloque (`>`) se leen del texto tal
  // cual, y cada línea se escapa después, ya dentro de `renderInline`.
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];

  /** Líneas del bloque que estamos acumulando y de qué tipo es. */
  let buffer: string[] = [];
  let current: BlockKind | null = null;

  const flush = (): void => {
    if (!current || buffer.length === 0) {
      buffer = [];
      current = null;
      return;
    }
    const rendered = buffer.map((l) => renderInline(l, tokens));
    switch (current) {
      case 'quote':
        html.push(`<blockquote>${rendered.join('<br>')}</blockquote>`);
        break;
      case 'ul':
      case 'ol': {
        const tag = current === 'ul' ? 'ul' : 'ol';
        html.push(`<${tag}>${rendered.map((l) => `<li>${l}</li>`).join('')}</${tag}>`);
        break;
      }
      case 'p':
        html.push(`<p>${rendered.join('<br>')}</p>`);
        break;
    }
    buffer = [];
    current = null;
  };

  for (const line of lines) {
    if (line.trim() === '') { flush(); continue; } // línea en blanco = fin de bloque
    const kind = kindOf(line);
    if (current !== null && kind !== current) flush();
    current = kind;
    buffer.push(stripMarker(line, kind));
  }
  flush();

  return tokens.restore(html.join(''));
}

/** Etiquetas que delatan que un texto se escribió como HTML, no como markdown. */
const HTML_TAG =
  /<\/?(p|div|span|br|hr|h[1-6]|ul|ol|li|blockquote|pre|code|table|thead|tbody|tr|td|th|img|figure|figcaption|section|article|iframe|strong|em|b|i|u|s|a)\b[^>]*>/i;

/**
 * ¿Este texto es HTML antiguo en vez de markdown?
 *
 * Sirve para convivir con contenido escrito **antes** de que existiera el
 * markdown (los posts del blog los redactaba el administrador directamente en
 * HTML). Si lo es, hay que seguir pintándolo tal cual: pasarlo por
 * `renderMarkdown` escaparía las etiquetas y el lector vería `<p>Hola</p>` en
 * mitad del texto.
 *
 * Es una heurística y se asume: un texto en markdown que mencione literalmente
 * una etiqueta HTML se pintará como HTML. En la práctica no pasa, y aunque
 * pasara, Angular sanitiza igual al pintar.
 */
export function looksLikeHtml(source: string | null | undefined): boolean {
  return !!source && HTML_TAG.test(source);
}

/**
 * Quita las marcas y devuelve texto plano. Para sitios donde se enseña un
 * adelanto del mensaje (citas, "último mensaje", excerpts) y el HTML estorba.
 */
export function stripMarkdown(source: string | null | undefined): string {
  if (!source) return '';
  return source
    .replace(/\r\n?/g, '\n')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '$1')
    .replace(/__(?=\S)([\s\S]*?\S)__/g, '$1')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')
    .replace(/\*(?=\S)([^*\n]*?\S)\*/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
