const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a date-only `YYYY-MM-DD` string into a Date at midnight UTC.
 *
 * UTC, not local time, so that day arithmetic is never shifted by a daylight-saving change.
 * Throws a RangeError for anything that is not a real calendar date (e.g. `2026-02-30`).
 */
export function parseIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new RangeError(`Expected a YYYY-MM-DD date, got "${value}"`);
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC silently rolls 30 February over into March. Reject that instead.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`"${value}" is not a real calendar date`);
  }

  return date;
}
