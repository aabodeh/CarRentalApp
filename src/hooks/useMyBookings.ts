import { useMemo } from 'react';

import { useBookings } from '../context/BookingContext';
import type { StoredBooking } from '../repositories/bookingRepository';
import { bookedCarName } from '../utils/carLabels';
import { useCars } from './useCars';

export type BookingItem = {
  record: StoredBooking;
  /** "Tesla Model 3", from the cached car list; "Car 5" if that car is not known here. */
  carName: string;
};

/** Every state the My bookings list can be in, as a union so the screen handles each one. */
export type MyBookingsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty' }
  | { status: 'ready'; items: BookingItem[] };

/** The user's bookings, newest first, each with its car's name. */
export function useMyBookings(): MyBookingsState {
  const { records, load, reload } = useBookings();
  const { state: carsState } = useCars();

  return useMemo((): MyBookingsState => {
    if (load.status === 'loading') return { status: 'loading' };
    if (load.status === 'error') return { status: 'error', error: load.error, retry: reload };
    if (records.length === 0) return { status: 'empty' };

    const cars = carsState.status === 'ready' ? carsState.cars : [];
    const items = [...records]
      .sort((a, b) => b.booking.createdAt.localeCompare(a.booking.createdAt))
      .map((record) => ({ record, carName: bookedCarName(cars, record.booking.carId) }));
    return { status: 'ready', items };
  }, [records, load, reload, carsState]);
}
