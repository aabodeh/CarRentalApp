import { useMemo } from 'react';

import { useBookings } from '../context/BookingContext';
import { todayIsoDate } from '../utils/localDate';
import { nextBooking } from '../utils/nextBooking';
import { useCars } from './useCars';
import { useFavourites } from './useFavourites';

export type ProfileStats = {
  /** Every booking made on this phone, whatever its sync status. */
  bookingsMade: number;
  /** The booking that starts soonest, today or later. */
  next: { carName: string; startDate: string; endDate: string } | null;
  /** Saved cars still in the catalogue: the number the Saved tab shows. */
  savedCars: number;
};

/** The profile's small stats, counted from the bookings and favourites on this phone. */
export function useProfileStats(): ProfileStats {
  const { records } = useBookings();
  const { state: carsState } = useCars();
  const { ids } = useFavourites();

  return useMemo(() => {
    const cars = carsState.status === 'ready' ? carsState.cars : [];
    const upcoming = nextBooking(
      records.map((record) => record.booking),
      todayIsoDate()
    );
    const car = upcoming ? cars.find((candidate) => candidate.id === upcoming.carId) : undefined;

    return {
      bookingsMade: records.length,
      next: upcoming
        ? {
            carName: car ? `${car.make} ${car.model}` : `Car ${upcoming.carId}`,
            startDate: upcoming.startDate,
            endDate: upcoming.endDate,
          }
        : null,
      // Until there is a list to check against, every saved id counts; then only listed ones.
      savedCars:
        carsState.status === 'ready' || carsState.status === 'empty'
          ? cars.filter((candidate) => ids.has(candidate.id)).length
          : ids.size,
    };
  }, [records, carsState, ids]);
}
