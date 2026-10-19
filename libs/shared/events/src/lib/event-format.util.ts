/**
 * Formateo de fechas para la librería de eventos usando `Intl.DateTimeFormat`.
 * Ventaja sobre `DatePipe`: no exige registrar datos de locale de Angular
 * (`registerLocaleData`), así que la lib funciona en cualquier app con solo
 * pasarle el locale. Cae con elegancia a la cadena original si la fecha no es válida.
 */
export function formatEventDate(
  date: string | Date,
  locale = 'es-ES',
  options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  try {
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatEventTime(date: string | Date, locale = 'es-ES'): string {
  return formatEventDate(date, locale, { hour: '2-digit', minute: '2-digit' });
}
