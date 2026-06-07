import crypto from 'crypto';

/** Generates a compact unique id. */
export function makeId(): string {
  return crypto.randomBytes(12).toString('hex');
}

/** Today's date as YYYY-MM-DD (server-local). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
