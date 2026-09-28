import { parseIsoDate } from './parseIsoDate';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Number of rental days between pick-up and return, counted as 24-hour periods:
 * 1 Oct → 3 Oct is 2 days. A same-day rental is charged as 1 day.
 *
 * Business rule, also stated in the design doc's class diagram: a same-day rental counts as one day.
 *
 * Throws a RangeError if either date is malformed or the range ends before it starts.
 * The UI should validate first; this is the last line of defence, not the validator.
 */
export function daysBetween(startDate: string, endDate: string): number {
  const days = (parseIsoDate(endDate).getTime() - parseIsoDate(startDate).getTime()) / MS_PER_DAY;

  if (days < 0) {
    throw new RangeError(`Return date ${endDate} is before pick-up date ${startDate}`);
  }

  return Math.max(days, 1);
}
