import type { StoredBooking } from '../../src/storage/bookingStore';

/** A stored booking for tests; override what the test is about. */
export function storedBooking(
  overrides: {
    id?: string;
    carId?: string;
    createdAt?: string;
    syncStatus?: StoredBooking['booking']['syncStatus'];
    sync?: Partial<StoredBooking['sync']>;
  } = {}
): StoredBooking {
  return {
    booking: {
      id: overrides.id ?? 'booking-1',
      carId: overrides.carId ?? 'car-05',
      renterName: 'Mette Frederiksen',
      renterEmail: 'mette@example.dk',
      startDate: '2026-10-01',
      endDate: '2026-10-03',
      totalPrice: 1498,
      createdAt: overrides.createdAt ?? '2026-09-28T08:00:00.000Z',
      syncStatus: overrides.syncStatus ?? 'pending',
    },
    sync: { attempts: 0, nextRetryAt: null, rejected: false, ...overrides.sync },
  };
}
