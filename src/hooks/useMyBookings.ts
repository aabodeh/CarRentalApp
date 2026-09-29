import { useMemo } from 'react';

import { useBookings } from '../context/BookingContext';
import type { StoredBooking } from '../repositories/bookingRepository';
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

    const names = new Map(
      carsState.status === 'ready'
        ? carsState.cars.map((car) => [car.id, `${car.make} ${car.model}`] as const)
        : []
    );
    const items = [...records]
      .sort((a, b) => b.booking.createdAt.localeCompare(a.booking.createdAt))
      .map((record) => ({
        record,
        carName: names.get(record.booking.carId) ?? `Car ${record.booking.carId}`,
      }));
    return { status: 'ready', items };
  }, [records, load, reload, carsState]);
}
