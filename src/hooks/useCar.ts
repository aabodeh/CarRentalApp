import { useCallback, useEffect, useMemo, useState } from 'react';

import { carRepository, type CarsEvent, type Freshness } from '../repositories/carRepository';
import type { Car } from '../types';

/**
 * Every state a single car can be in. `not-found` is its own status, not a flavour of error:
 * retrying will not make a missing car appear, so the screen needs a different design for it.
 */
export type CarState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'ready'; car: Car; fetchedAt: string; freshness: Freshness };

/**
 * One car, read from the same cached list as the car list (K1). The details screen therefore
 * always agrees with the list, and any car already seen opens offline.
 */
export function useCar(id: string): CarState {
  const [event, setEvent] = useState<CarsEvent | null>(null);

  const retry = useCallback(() => {
    setEvent(null);
    void carRepository.refreshCars();
  }, []);

  useEffect(() => carRepository.subscribeCars(setEvent), []);

  return useMemo((): CarState => {
    if (!event) return { status: 'loading' };
    if (event.type === 'error') return { status: 'error', error: event.error, retry };
    const car = event.snapshot.cars.find((candidate) => candidate.id === id);
    if (!car) return { status: 'not-found' };
    return {
      status: 'ready',
      car,
      fetchedAt: event.snapshot.fetchedAt,
      freshness: event.snapshot.freshness,
    };
  }, [event, id, retry]);
}
