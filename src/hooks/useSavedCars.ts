import { useMemo } from 'react';

import type { Car } from '../types';
import { useCars } from './useCars';
import { useFavourites } from './useFavourites';

/**
 * Every state the Saved tab can be in. `empty` means nothing is saved at all. `ready` can still
 * have no cars to show, when every saved car has left the catalogue: `missingIds` says so.
 */
export type SavedCarsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty' }
  | { status: 'ready'; cars: Car[]; missingIds: string[] };

export type UseSavedCarsResult = {
  state: SavedCarsState;
  toggle: (carId: string) => void;
  remove: (carIds: readonly string[]) => void;
};

/**
 * The saved cars, most recently saved first, taken from the same cached list as the Cars tab (K1),
 * so they show offline too.
 *
 * A saved car that is not in the list any more is **not** removed automatically: the list may be
 * an old saved copy, and a car can come back. It is left out of the list and counted in
 * `missingIds`, and the user decides whether to remove it.
 */
export function useSavedCars(): UseSavedCarsResult {
  const { state: carsState } = useCars();
  const { ids, toggle, remove } = useFavourites();

  const state = useMemo((): SavedCarsState => {
    if (ids.size === 0) return { status: 'empty' };
    if (carsState.status === 'loading') return { status: 'loading' };
    if (carsState.status === 'error') {
      return { status: 'error', error: carsState.error, retry: carsState.retry };
    }

    const listed = new Map(
      (carsState.status === 'ready' ? carsState.cars : []).map((car) => [car.id, car] as const)
    );
    const newestFirst = [...ids].reverse();
    return {
      status: 'ready',
      cars: newestFirst.flatMap((id) => listed.get(id) ?? []),
      missingIds: newestFirst.filter((id) => !listed.has(id)),
    };
  }, [ids, carsState]);

  return { state, toggle, remove };
}
