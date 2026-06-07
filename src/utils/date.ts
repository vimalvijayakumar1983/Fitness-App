import type { ISODateString } from '@/models/types';

/** Returns today's local date as an ISO date string (YYYY-MM-DD). */
export function todayISO(): ISODateString {
  return toISODate(new Date());
}

/** Converts a Date to a local ISO date string (YYYY-MM-DD). */
export function toISODate(date: Date): ISODateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Human-friendly label, e.g. "Sun, Jun 7". */
export function formatDateLabel(iso: ISODateString): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Formats a time-of-day, e.g. "8:30 AM". */
export function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Formats a duration in minutes as "7h 30m" / "45m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Generates a reasonably unique id without external dependencies. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
