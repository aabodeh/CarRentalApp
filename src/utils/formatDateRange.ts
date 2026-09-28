import { parseIsoDate } from './parseIsoDate';

/**
 * Danish short month names. Hard-coded rather than taken from Intl so the output is identical on
 * Hermes, in Node (Jest) and on the web — Intl date formatting differs between those engines.
 */
const MONTHS = [
  'jan.',
  'feb.',
  'mar.',
  'apr.',
  'maj',
  'jun.',
  'jul.',
  'aug.',
  'sep.',
  'okt.',
  'nov.',
  'dec.',
];

/**
 * Formats a rental period compactly, dropping whatever the two dates share:
 * `1. okt. 2026`, `1.–3. okt. 2026`, `30. sep.–3. okt. 2026`, `30. dec. 2026–2. jan. 2027`.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (end < start) {
    throw new RangeError(`Return date ${endDate} is before pick-up date ${startDate}`);
  }

  const day = (d: Date) => `${d.getUTCDate()}.`;
  const month = (d: Date) => MONTHS[d.getUTCMonth()];
  const year = (d: Date) => d.getUTCFullYear();

  const endLabel = `${day(end)} ${month(end)} ${year(end)}`;

  if (start.getTime() === end.getTime()) {
    return endLabel;
  }
  if (year(start) !== year(end)) {
    return `${day(start)} ${month(start)} ${year(start)}–${endLabel}`;
  }
  if (month(start) !== month(end)) {
    return `${day(start)} ${month(start)}–${endLabel}`;
  }
  return `${day(start)}–${endLabel}`;
}
