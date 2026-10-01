import type { Booking } from '../types';

/**
 * The booking that starts soonest, today or later, whatever its sync status. Null when there is
 * none. ISO dates compare correctly as strings; on the same start date, the earlier-made wins.
 */
export function nextBooking(bookings: readonly Booking[], today: string): Booking | null {
  const upcoming = bookings
    .filter((booking) => booking.startDate >= today)
    .sort(
      (a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
    );
  return upcoming[0] ?? null;
}
