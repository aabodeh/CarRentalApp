import AsyncStorage from '@react-native-async-storage/async-storage';

import { bookingStore } from '../../src/storage/bookingStore';
import type { Booking } from '../../src/types';

const booking: Booking = {
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

describe('bookingStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts empty', async () => {
    await expect(bookingStore.read()).resolves.toEqual([]);
  });

  it('keeps bookings across a restart (a fresh read of storage)', async () => {
    await bookingStore.write([booking]);

    await expect(bookingStore.read()).resolves.toEqual([booking]);
    expect(await AsyncStorage.getItem('carrental.v1.bookings')).toContain('booking-1');
  });

  it('starts empty rather than crashing when the stored bookings are corrupt', async () => {
    await AsyncStorage.setItem('carrental.v1.bookings', 'not json');

    await expect(bookingStore.read()).resolves.toEqual([]);
  });
});
