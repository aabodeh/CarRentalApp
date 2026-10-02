import { useMemo } from 'react';

import { useBookings } from '../context/BookingContext';
import type { StoredBooking } from '../repositories/bookingRepository';
import { bookedCarName } from '../utils/carLabels';
import { useCars } from './useCars';

/** Every state the booking details screen can be in, as a union so the screen handles each one. */
export type BookingDetailsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'not-found' }
  | { status: 'ready'; record: StoredBooking; carName: string };

/**
 * One booking from this phone, with its car's name. Read from BookingContext rather than passed
 * in, so the screen follows the booking as the retry queue moves it (pending → completed).
 */
export function useBookingDetails(bookingId: string): BookingDetailsState {
  const { records, load, reload } = useBookings();
  const { state: carsState } = useCars();

  return useMemo((): BookingDetailsState => {
    if (load.status === 'loading') return { status: 'loading' };
    if (load.status === 'error') return { status: 'error', error: load.error, retry: reload };

    const record = records.find((candidate) => candidate.booking.id === bookingId);
    if (!record) return { status: 'not-found' };

    const cars = carsState.status === 'ready' ? carsState.cars : [];
    return { status: 'ready', record, carName: bookedCarName(cars, record.booking.carId) };
  }, [bookingId, records, load, reload, carsState]);
}
