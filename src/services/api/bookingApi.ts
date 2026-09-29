import type { Booking } from '../../types';
import { ApiStatusError, request } from './client';

type CreatedBooking = { id: string };

const isCreatedBooking = (value: unknown): value is CreatedBooking =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).id === 'string';

/**
 * POST /bookings. Sends our local booking id as `clientBookingId`, so a retried request can be
 * recognised as the same booking (PR 5, K2). `syncStatus` is local state and is not sent.
 */
export async function postBooking(booking: Booking): Promise<{ remoteId: string }> {
  const created = await request('/bookings', isCreatedBooking, {
    method: 'POST',
    body: {
      carId: booking.carId,
      renterName: booking.renterName,
      renterEmail: booking.renterEmail,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      clientBookingId: booking.id,
    },
  });
  return { remoteId: created.id };
}

type RemoteBooking = { id: string; clientBookingId: string };

const isRemoteBookingArray = (value: unknown): value is RemoteBooking[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as RemoteBooking).id === 'string' &&
      typeof (item as RemoteBooking).clientBookingId === 'string'
  );

/**
 * Has the server already got this booking? The idempotency check before a retry (K2): a previous
 * attempt may have reached the server even though we never saw the answer (a timeout).
 *
 * MockAPI behaviour, observed 2026-09-29 (docs/api/README.md):
 * - `?clientBookingId=x` matches as a *substring* ("probe-a" also returned "probe-ab"), so the
 *   match is made exact here;
 * - when nothing matches it answers 404 "Not found" instead of `[]`, so 404 means "not there".
 */
export async function findBookingByClientId(
  clientBookingId: string
): Promise<{ remoteId: string } | null> {
  let matches: RemoteBooking[];
  try {
    matches = await request(
      `/bookings?clientBookingId=${encodeURIComponent(clientBookingId)}`,
      isRemoteBookingArray
    );
  } catch (error) {
    if (error instanceof ApiStatusError && error.status === 404) return null;
    throw error;
  }
  const exact = matches.find((booking) => booking.clientBookingId === clientBookingId);
  return exact ? { remoteId: exact.id } : null;
}
