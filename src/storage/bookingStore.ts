import type { Booking } from '../types';
import { isBookingArray } from '../types/guards';
import { readJson, writeJson } from './keyValueStore';

/**
 * Every booking made on this phone, with its sync status, so bookings survive a restart.
 * Key: `carrental.v1.bookings`.
 *
 * Reserved for PR 5 (K2), not built yet: `carrental.v1.sync-queue` — the outbox of bookings still
 * to send, as `{ bookingId, attempts, nextAttemptAt, lastError }[]`. It is kept separate so a
 * Booking stays a pure domain object; retry bookkeeping is not part of the class diagram.
 */
export const bookingStore = {
  async read(): Promise<Booking[]> {
    const stored = await readJson('bookings', isBookingArray);
    return stored ? stored.data : [];
  },

  write(bookings: Booking[]): Promise<void> {
    return writeJson('bookings', bookings);
  },
};
