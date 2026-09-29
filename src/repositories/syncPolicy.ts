import type { StoredBooking } from '../storage/bookingStore';

/**
 * K2 — the retry rules for sending bookings to the API, in one place.
 *
 * - A booking is saved on the phone first, always; sending it is a separate, retried step.
 * - Attempts are only made while the device is online. Offline, a booking waits as `pending`
 *   without using up attempts, and is sent when the connection returns.
 * - A failed attempt while online (server down, timeout, 5xx) is retried after 2 s, 8 s, then 30 s.
 *   After the fourth attempt the queue stops and the user retries by hand ("Try again").
 * - A booking the server *refuses* (4xx, malformed reply) is not retried automatically: sending the
 *   same thing again will not change the answer.
 * - Retries are triggered by the timer, by the app returning to the foreground, by the network
 *   coming back, and at app start (bookings still unsent from a previous session).
 *
 * OUT OF SCOPE (deliberately, for the deadline — see AGENTS.md > K1–K3):
 * - retrying while the app is closed (would need expo-background-task / OS background fetch)
 * - conflict resolution (the server never changes a booking after creation in this app)
 * - multi-device sync (a booking lives on the phone that made it; two devices retrying the same
 *   booking at once could still duplicate it)
 */

/** Delay before retry n, after the nth failed attempt. */
export const RETRY_DELAYS_MS = [2_000, 8_000, 30_000] as const;

/** The first attempt plus one per delay. */
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

/** When to try again after `attempts` failed attempts, or null to stop and wait for the user. */
export function nextRetryAt(attempts: number, now: Date): string | null {
  const delay = RETRY_DELAYS_MS[attempts - 1];
  return delay === undefined ? null : new Date(now.getTime() + delay).toISOString();
}

/** Will the queue send this booking again by itself at some point? */
export function isAutoRetryable({ booking, sync }: StoredBooking): boolean {
  if (booking.syncStatus === 'completed' || sync.rejected) return false;
  return booking.syncStatus === 'pending' || sync.nextRetryAt !== null;
}

/** Should the queue send this booking now? A never-sent booking is always due. */
export function isDue(record: StoredBooking, now: Date): boolean {
  if (!isAutoRetryable(record)) return false;
  if (record.booking.syncStatus === 'pending') return true;
  return record.sync.nextRetryAt !== null && new Date(record.sync.nextRetryAt) <= now;
}

/** Is the user's "Try again" the only way forward for this booking? */
export function needsManualRetry(record: StoredBooking): boolean {
  return record.booking.syncStatus === 'failed' && !isAutoRetryable(record);
}
