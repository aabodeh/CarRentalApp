import { daysBetween } from './daysBetween';

/** Total rental price in DKK: day rate × rental days (see `daysBetween` for how days count). */
export function calculateTotalPrice(
  pricePerDay: number,
  startDate: string,
  endDate: string
): number {
  if (!Number.isFinite(pricePerDay) || pricePerDay < 0) {
    throw new RangeError(`Invalid day rate: ${pricePerDay}`);
  }

  return pricePerDay * daysBetween(startDate, endDate);
}
