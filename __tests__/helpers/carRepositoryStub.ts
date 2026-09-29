import { act } from '@testing-library/react-native';

import {
  carRepository,
  type CarsEvent,
  type Freshness,
} from '../../src/repositories/carRepository';
import type { Car } from '../../src/types';

/**
 * Replaces the shared carRepository's subscription with one the test drives by hand, so hook and
 * screen tests can say "the repository now has these cars" without timers or a real cache.
 * Restored by `jest.restoreAllMocks()`.
 */
export function stubCarRepository() {
  const listeners = new Set<(event: CarsEvent) => void>();
  let last: CarsEvent | null = null;

  const subscribe = jest.spyOn(carRepository, 'subscribeCars').mockImplementation((listener) => {
    listeners.add(listener);
    if (last) listener(last);
    return () => {
      listeners.delete(listener);
    };
  });
  const refresh = jest.spyOn(carRepository, 'refreshCars').mockResolvedValue();

  const emit = (event: CarsEvent) => {
    last = event;
    act(() => {
      listeners.forEach((listener) => listener(event));
    });
  };

  return {
    subscribe,
    refresh,
    /** The repository now serves these cars. */
    emitCars(
      cars: Car[],
      { fetchedAt = '2026-09-29T10:00:00.000Z', freshness = 'fresh' as Freshness } = {}
    ) {
      emit({ type: 'snapshot', snapshot: { cars, fetchedAt, freshness } });
    },
    /** The repository has no cars and could not fetch any. */
    emitError(error: Error) {
      emit({ type: 'error', error });
    },
    listenerCount: () => listeners.size,
  };
}
