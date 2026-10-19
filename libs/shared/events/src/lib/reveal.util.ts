import { EventSection } from '@org/models';

/**
 * Decide si una sección debe mostrarse según el reveal progresivo.
 * - Sin `revealFrom`/`revealUntil` → siempre visible.
 * - `revealFrom` en el futuro → oculta hasta esa fecha.
 * - `revealUntil` en el pasado → oculta a partir de esa fecha.
 */
export function isRevealed(section: EventSection, now: Date = new Date()): boolean {
  const t = now.getTime();
  if (section.revealFrom) {
    const from = Date.parse(section.revealFrom);
    if (!Number.isNaN(from) && t < from) return false;
  }
  if (section.revealUntil) {
    const until = Date.parse(section.revealUntil);
    if (!Number.isNaN(until) && t >= until) return false;
  }
  return true;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

/** Descompone el tiempo restante hasta `target` en días/horas/min/seg. */
export function countdownTo(target: string | Date, now: Date = new Date()): CountdownParts {
  const targetMs = target instanceof Date ? target.getTime() : Date.parse(target);
  let diff = Math.floor((targetMs - now.getTime()) / 1000);
  if (Number.isNaN(targetMs) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  }
  const days = Math.floor(diff / 86400); diff -= days * 86400;
  const hours = Math.floor(diff / 3600); diff -= hours * 3600;
  const minutes = Math.floor(diff / 60); diff -= minutes * 60;
  return { days, hours, minutes, seconds: diff, finished: false };
}
