import { parseIsoDate } from './parseIsoDate';

/**
 * Conversions between our `YYYY-MM-DD` date strings and the user's *local* calendar.
 *
 * `parseIsoDate` works in UTC so that day arithmetic never shifts. But "today" and the date
 * picker are about the user's wall clock: at 00:30 in Copenhagen it is already tomorrow locally
 * while UTC still says yesterday. These helpers are for that local side.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day of `date`, as `YYYY-MM-DD`. */
export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today in the user's time zone. `now` is injectable so tests do not depend on the clock. */
export function todayIsoDate(now: Date = new Date()): string {
  return toLocalIsoDate(now);
}

/** A `YYYY-MM-DD` date as a local Date at midnight — what the native date picker expects. */
export function isoToLocalDate(iso: string): Date {
  const utc = parseIsoDate(iso);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** The date `days` days after `iso`. Works in UTC, so it is safe across daylight-saving changes. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
