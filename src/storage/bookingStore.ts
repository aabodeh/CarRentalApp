import type { Booking } from '../types';
import { isBooking } from '../types/guards';
import { readJson, writeJson } from './keyValueStore';

/**
 * Retry bookkeeping for one booking (K2). Local state only: never sent to the API, and not part of
 * the `Booking` domain type, which mirrors the class diagram.
 */
export type SyncMeta = {
  /** Sync attempts made while online, successful or not. */
  attempts: number;
  /** When the next automatic attempt is due; null when none is scheduled. */
  nextRetryAt: string | null;
  /** The server refused the booking (4xx / malformed reply): no automatic retries. */
  rejected: boolean;
};

/** A booking as stored on the phone: the domain object plus its retry bookkeeping. */
export type StoredBooking = { booking: Booking; sync: SyncMeta };

const isSyncMeta = (value: unknown): value is SyncMeta => {
  if (typeof value !== 'object' || value === null) return false;
  const meta = value as Record<string, unknown>;
  return (
    typeof meta.attempts === 'number' &&
    Number.isInteger(meta.attempts) &&
    meta.attempts >= 0 &&
    (meta.nextRetryAt === null || typeof meta.nextRetryAt === 'string') &&
    typeof meta.rejected === 'boolean'
  );
};

const isStoredBookingArray = (value: unknown): value is StoredBooking[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      isBooking((item as StoredBooking).booking) &&
      isSyncMeta((item as StoredBooking).sync)
  );

/**
 * Every booking made on this phone, with its sync status and retry bookkeeping, so bookings (and
 * their place in the retry queue) survive a restart. Key: `carrental.v2.bookings`.
 *
 * There is no separate queue: the retry queue is *derived* from these records (see
 * src/repositories/syncPolicy.ts), so there is one source of truth for what still needs sending.
 */
export const bookingStore = {
  async read(): Promise<StoredBooking[]> {
    const stored = await readJson('bookings', isStoredBookingArray);
    return stored ? stored.data : [];
  },

  write(records: StoredBooking[]): Promise<void> {
    return writeJson('bookings', records);
  },
};
