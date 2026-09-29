import type { Booking } from '../../types';
import { request } from './client';

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
