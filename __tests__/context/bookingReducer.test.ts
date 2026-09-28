import { bookingReducer, initialBookingState } from '../../src/context/BookingContext';
import type { Booking } from '../../src/types';

const pending: Booking = {
  id: 'booking-1',
  carId: 'car-05',
  renterName: 'Mette',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  totalPrice: 1498,
  createdAt: '2026-09-28T08:00:00.000Z',
  syncStatus: 'pending',
};

describe('bookingReducer', () => {
  it('starts with no bookings and nothing in flight', () => {
    expect(initialBookingState).toEqual({ bookings: [], creation: { status: 'idle' } });
  });

  it('marks creation as submitting when it starts', () => {
    const state = bookingReducer(initialBookingState, { type: 'create/start' });
    expect(state.creation).toEqual({ status: 'submitting' });
  });

  it('adds the new booking and returns to idle when creation succeeds', () => {
    const submitting = bookingReducer(initialBookingState, { type: 'create/start' });
    const state = bookingReducer(submitting, { type: 'create/success', booking: pending });

    expect(state).toEqual({ bookings: [pending], creation: { status: 'idle' } });
  });

  it('keeps the error when creation fails, and adds nothing', () => {
    const error = new Error('offline');
    const state = bookingReducer(initialBookingState, { type: 'create/failure', error });

    expect(state).toEqual({ bookings: [], creation: { status: 'error', error } });
  });

  it('replaces a booking with its synced version', () => {
    const withBooking = bookingReducer(initialBookingState, {
      type: 'create/success',
      booking: pending,
    });
    const synced = { ...pending, syncStatus: 'completed' as const };

    const state = bookingReducer(withBooking, { type: 'sync/settled', booking: synced });

    expect(state.bookings).toEqual([synced]);
  });

  it('marks a booking as failed when its sync fails, keeping it rather than dropping it', () => {
    const withBooking = bookingReducer(initialBookingState, {
      type: 'create/success',
      booking: pending,
    });

    const state = bookingReducer(withBooking, { type: 'sync/failed', bookingId: 'booking-1' });

    expect(state.bookings).toEqual([{ ...pending, syncStatus: 'failed' }]);
  });

  it('leaves other bookings alone when one settles', () => {
    const other = { ...pending, id: 'booking-2' };
    const state = bookingReducer(
      { bookings: [pending, other], creation: { status: 'idle' } },
      { type: 'sync/settled', booking: { ...pending, syncStatus: 'completed' } }
    );

    expect(state.bookings[1]).toBe(other);
  });
});
