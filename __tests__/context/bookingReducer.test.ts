import { bookingReducer, initialBookingState } from '../../src/context/BookingContext';
import type { StoredBooking } from '../../src/storage/bookingStore';

const record = (
  syncStatus: StoredBooking['booking']['syncStatus'],
  attempts = 0,
  id = 'booking-1'
): StoredBooking => ({
  booking: {
    id,
    carId: '5',
    renterName: 'Mette',
    renterEmail: 'mette@example.dk',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    totalPrice: 1498,
    createdAt: '2026-09-28T08:00:00.000Z',
    syncStatus,
  },
  sync: { attempts, nextRetryAt: null, rejected: false },
});

describe('bookingReducer', () => {
  it('starts loading, with no bookings, nothing in flight and no notice', () => {
    expect(initialBookingState).toEqual({
      records: [],
      load: { status: 'loading' },
      creation: { status: 'idle' },
      notice: null,
    });
  });

  it('shows the saved bookings once loaded, keeping any created since launch', () => {
    const createdNow = bookingReducer(initialBookingState, {
      type: 'create/success',
      record: record('pending', 0, 'new'),
    });

    const state = bookingReducer(createdNow, {
      type: 'records/loaded',
      records: [record('completed', 1, 'saved')],
    });

    expect(state.records.map((r) => r.booking.id)).toEqual(['saved', 'new']);
    expect(state.load).toEqual({ status: 'ready' });
  });

  it('reports a failed load', () => {
    const error = new Error('disk');

    expect(bookingReducer(initialBookingState, { type: 'records/failed', error }).load).toEqual({
      status: 'error',
      error,
    });
  });

  it('tracks creation from submitting to idle, or to an error', () => {
    const submitting = bookingReducer(initialBookingState, { type: 'create/start' });
    expect(submitting.creation).toEqual({ status: 'submitting' });

    const error = new Error('invalid');
    expect(bookingReducer(submitting, { type: 'create/failure', error }).creation).toEqual({
      status: 'error',
      error,
    });
  });

  it('replaces a booking with its updated version', () => {
    const withBooking = { ...initialBookingState, records: [record('pending')] };

    const state = bookingReducer(withBooking, {
      type: 'record/updated',
      record: record('failed', 1),
    });

    expect(state.records).toEqual([record('failed', 1)]);
  });

  it('raises a notice when a booking succeeds after a failed attempt', () => {
    const withBooking = { ...initialBookingState, records: [record('failed', 1)] };

    const state = bookingReducer(withBooking, {
      type: 'record/updated',
      record: record('completed', 2),
    });

    expect(state.notice).toEqual(record('completed', 2));
    expect(bookingReducer(state, { type: 'notice/dismissed' }).notice).toBeNull();
  });

  it('raises no notice when a booking succeeds at the first attempt', () => {
    const state = bookingReducer(
      { ...initialBookingState, records: [record('pending')] },
      { type: 'record/updated', record: record('completed', 1) }
    );

    expect(state.notice).toBeNull();
  });
});
