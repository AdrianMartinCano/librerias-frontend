/**
 * Utilidades de calendario basadas en el estándar iCalendar (RFC 5545) + deep links.
 * Sirven para Google, Apple y Outlook a la vez, sin OAuth ni claves.
 */

export interface CalendarEventInput {
  title: string;
  date: string;            // 'YYYY-MM-DD'
  time: string;            // 'HH:mm'
  durationMinutes: number;
  description?: string;
}

/* ── Helpers de fecha/hora ── */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes;
  return `${pad(Math.floor((total % 1440) / 60))}:${pad(total % 60)}`;
}

/** 'YYYY-MM-DD' + 'HH:mm' → '20260618T090000' (hora local flotante, sin Z). */
function toIcsLocal(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

/** Marca de tiempo UTC actual: '20260616T101500Z'. */
function nowStampUtc(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escapa texto para un valor iCalendar (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/* ── Generación (.ics) ── */

function buildVevent(ev: CalendarEventInput, uid: string): string {
  const start = toIcsLocal(ev.date, ev.time);
  const end = toIcsLocal(ev.date, addMinutes(ev.time, ev.durationMinutes));
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStampUtc()}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

/** Genera un `.ics` (VCALENDAR) con uno o varios eventos. */
export function buildIcs(events: CalendarEventInput[], calendarName = 'Reservas'): string {
  const body = events.map((ev, i) => buildVevent(ev, `${toIcsLocal(ev.date, ev.time)}-${i}@ng-reservations`)).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ng-reservations//ES',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    body,
    'END:VCALENDAR',
  ].join('\r\n');
}

/* ── Deep links por evento ── */

/** URL para "Añadir a Google Calendar" (un evento). */
export function googleCalendarUrl(ev: CalendarEventInput): string {
  const dates = `${toIcsLocal(ev.date, ev.time)}/${toIcsLocal(ev.date, addMinutes(ev.time, ev.durationMinutes))}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates,
    ...(ev.description ? { details: ev.description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** URL para "Añadir a Outlook" (un evento). */
export function outlookCalendarUrl(ev: CalendarEventInput): string {
  const startIso = `${ev.date}T${ev.time}:00`;
  const endIso = `${ev.date}T${addMinutes(ev.time, ev.durationMinutes)}:00`;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: ev.title,
    startdt: startIso,
    enddt: endIso,
    ...(ev.description ? { body: ev.description } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/* ── Parseo (.ics → eventos) ── */

/** Desdobla las líneas plegadas (RFC 5545 §3.1: continuación con espacio/tab inicial). */
function unfold(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Parsea un valor de fecha-hora iCalendar a { date:'YYYY-MM-DD', time:'HH:mm' }. */
function parseDateTime(value: string): { date: string; time: string } | null {
  // value puede ser '20260618T090000', '20260618T080000Z' o '20260618' (fecha completa)
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, hh = '00', mi = '00', ss = '00', z] = m;
  if (z) {
    // UTC → convertir a hora local
    const local = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mi, +ss));
    return {
      date: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`,
      time: `${pad(local.getHours())}:${pad(local.getMinutes())}`,
    };
  }
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mi}` };
}

/** Extrae los eventos de un `.ics`. Tolera TZID/parámetros y líneas plegadas. */
export function parseIcs(text: string): CalendarEventInput[] {
  const lines = unfold(text);
  const events: CalendarEventInput[] = [];
  let inEvent = false;
  let cur: Partial<{ title: string; start: { date: string; time: string }; end: { date: string; time: string }; description: string }> = {};

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') { inEvent = true; cur = {}; continue; }
    if (upper === 'END:VEVENT') {
      if (cur.start) {
        const startMin = toMinutes(cur.start.time);
        const end = cur.end ?? cur.start;
        let duration = toMinutes(end.time) - startMin + (end.date !== cur.start.date ? 1440 : 0);
        if (!Number.isFinite(duration) || duration <= 0) duration = 60;
        events.push({
          title: cur.title?.trim() || 'Evento importado',
          date: cur.start.date,
          time: cur.start.time,
          durationMinutes: duration,
          description: cur.description,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const name = line.slice(0, colon).split(';')[0].toUpperCase();
    const value = line.slice(colon + 1);

    if (name === 'SUMMARY') cur.title = unescapeText(value);
    else if (name === 'DESCRIPTION') cur.description = unescapeText(value);
    else if (name === 'DTSTART') cur.start = parseDateTime(value) ?? undefined;
    else if (name === 'DTEND') cur.end = parseDateTime(value) ?? undefined;
  }
  return events;
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
