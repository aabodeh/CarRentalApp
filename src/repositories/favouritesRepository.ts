import { favouritesStore } from '../storage/favouritesStore';

/**
 * The cars saved on this phone, as a set of car ids. Local only: favourites are never sent to the
 * API, so there is nothing to queue (K2) and no sync status (K3).
 *
 * Shaped for `useSyncExternalStore`: `subscribe` and `getIds`. The ids are read from the phone on
 * the first subscription. Listeners hear only real changes; if nothing is stored, they hear
 * nothing, because the empty set they started with was already right.
 */
export type FavouritesRepository = {
  subscribe(onChange: () => void): () => void;
  /** The current set. The same object until it changes, as `useSyncExternalStore` requires. */
  getIds(): ReadonlySet<string>;
  /** Saves the car, or removes it if it was saved. Waits for the stored ids to be read first. */
  toggle(carId: string): Promise<void>;
  /** Removes several at once: the Saved tab's "remove cars that are no longer listed". */
  remove(carIds: readonly string[]): Promise<void>;
};

type Dependencies = {
  store: { read(): Promise<string[]>; write(carIds: string[]): Promise<void> };
};

const EMPTY: ReadonlySet<string> = new Set();

/** A repository over the given store. The app uses the shared instance below. */
export function createFavouritesRepository({ store }: Dependencies): FavouritesRepository {
  let ids: ReadonlySet<string> = EMPTY;
  let loaded: Promise<void> | null = null;
  // Writes run one after another, so a slow early write can never land after a later one.
  let writing: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  const set = (next: ReadonlySet<string>) => {
    ids = next;
    listeners.forEach((listener) => listener());
  };

  const load = (): Promise<void> => {
    if (!loaded) {
      loaded = store.read().then(
        (stored) => {
          if (stored.length > 0) set(new Set(stored));
        },
        () => {
          // Unreadable reads as "nothing saved" — the same rule as every stored value.
        }
      );
    }
    return loaded;
  };

  /** Shows the change at once, then saves it. If saving fails, the change is undone. */
  const change = async (update: (current: Set<string>) => void) => {
    await load();
    const previous = ids;
    const next = new Set(previous);
    update(next);
    set(next);
    const write = writing.then(() => store.write([...next]));
    writing = write.catch(() => undefined);
    try {
      await write;
    } catch (error) {
      if (ids === next) set(previous);
      throw error;
    }
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      void load();
      return () => {
        listeners.delete(onChange);
      };
    },

    getIds() {
      return ids;
    },

    toggle(carId) {
      return change((next) => {
        if (next.has(carId)) next.delete(carId);
        else next.add(carId);
      });
    },

    remove(carIds) {
      return change((next) => carIds.forEach((carId) => next.delete(carId)));
    },
  };
}

export const favouritesRepository: FavouritesRepository = createFavouritesRepository({
  store: favouritesStore,
});
