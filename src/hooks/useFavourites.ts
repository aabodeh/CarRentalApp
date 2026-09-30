import { useCallback, useSyncExternalStore } from 'react';

import { favouritesRepository } from '../repositories/favouritesRepository';

export type UseFavouritesResult = {
  /** Ids of the saved cars, in the order they were saved. */
  ids: ReadonlySet<string>;
  toggle: (carId: string) => void;
  remove: (carIds: readonly string[]) => void;
};

/**
 * The cars saved on this phone.
 *
 * No loading state: it is a small local read that starts with the Cars tab, the app's first
 * screen. Until it answers the set is empty, so a heart can show "not saved" for a few
 * milliseconds at launch, and a toggle made in that moment waits for the read before saving.
 *
 * A save that fails is undone by the repository, so the heart flips back. There is nothing more
 * to tell the user, and nothing to retry: favourites never leave the phone.
 */
export function useFavourites(): UseFavouritesResult {
  const ids = useSyncExternalStore(favouritesRepository.subscribe, favouritesRepository.getIds);

  const toggle = useCallback((carId: string) => {
    favouritesRepository.toggle(carId).catch(() => undefined);
  }, []);

  const remove = useCallback((carIds: readonly string[]) => {
    favouritesRepository.remove(carIds).catch(() => undefined);
  }, []);

  return { ids, toggle, remove };
}
