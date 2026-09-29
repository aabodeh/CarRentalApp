import AsyncStorage from '@react-native-async-storage/async-storage';

import { bookingStore, type StoredBooking } from '../../src/storage/bookingStore';

const record: StoredBooking = {
  booking: {
    id: 'booking-1',
    carId: '5',
    renterName: 'Mette',
    renterEmail: 'mette@example.dk',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    totalPrice: 1498,
    createdAt: '2026-09-28T08:00:00.000Z',
    syncStatus: 'failed',
  },
  sync: { attempts: 2, nextRetryAt: '2026-09-28T08:00:10.000Z', rejected: false },
};

describe('bookingStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts empty', async () => {
    await expect(bookingStore.read()).resolves.toEqual([]);
  });

  it('keeps a booking and its place in the retry queue across a restart', async () => {
    await bookingStore.write([record]);

    await expect(bookingStore.read()).resolves.toEqual([record]);
    expect(await AsyncStorage.getItem('carrental.v2.bookings')).toContain('booking-1');
  });

  it('starts empty rather than crashing when the stored bookings are corrupt', async () => {
    await AsyncStorage.setItem('carrental.v2.bookings', 'not json');

    await expect(bookingStore.read()).resolves.toEqual([]);
  });

  it('discards bookings stored in the old v1 shape', async () => {
    await AsyncStorage.setItem(
      'carrental.v2.bookings',
      JSON.stringify({ version: 2, savedAt: '2026-09-28T08:00:00.000Z', data: [record.booking] })
    );

    await expect(bookingStore.read()).resolves.toEqual([]);
  });
});
