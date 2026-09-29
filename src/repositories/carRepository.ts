import { fetchCars as fetchCarsFromApi } from '../services/api/carApi';
import { carCache } from '../storage/carCache';
import type { Car } from '../types';
import { toError } from '../utils/toError';

/** Thrown by `getCarById` when no car has that id. Screens must handle it. */
export class CarNotFoundError extends Error {
  readonly carId: string;

  constructor(carId: string) {
    super(`No car with id "${carId}"`);
    this.name = 'CarNotFoundError';
    this.carId = carId;
  }
}

/**
 * How current the cars are:
 * - `refreshing` — served from the cache while the network is asked
 * - `fresh`      — the network just answered
 * - `stale`      — the network failed; this is the last copy we had (K1)
 */
export type Freshness = 'refreshing' | 'fresh' | 'stale';

export type CarsSnapshot = { cars: Car[]; fetchedAt: string; freshness: Freshness };

/** What a subscriber hears: cars (possibly more than once), or an error when there is nothing. */
export type CarsEvent =
  { type: 'snapshot'; snapshot: CarsSnapshot } | { type: 'error'; error: Error };

/**
 * The contract every car source implements.
 *
 * K1 — cache, then refresh: a subscriber hears the cached cars at once (if any), then the fresh
 * ones when the API answers. If the API fails, a cached copy keeps being served, marked `stale`;
 * only with no copy at all is it an error.
 */
export type CarRepository = {
  subscribeCars(listener: (event: CarsEvent) => void): () => void;
  /** Ask the API again (pull-to-refresh, retry). Concurrent calls share one request. */
  refreshCars(): Promise<void>;
  /** One car, cache first — works offline for any car already seen. */
  getCarById(id: string): Promise<Car>;
};

type Dependencies = {
  fetchCars: () => Promise<Car[]>;
  cache: {
    read(): Promise<{ cars: Car[]; fetchedAt: string } | null>;
    write(cars: Car[], fetchedAt?: Date): Promise<void>;
  };
};

/** A repository over the given API and cache. The app uses the shared instance below. */
export function createCarRepository({ fetchCars, cache }: Dependencies): CarRepository {
  let current: CarsSnapshot | null = null;
  let lastError: Error | null = null;
  let started: Promise<void> | null = null;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<(event: CarsEvent) => void>();

  const emit = (event: CarsEvent) => listeners.forEach((listener) => listener(event));
  const setSnapshot = (snapshot: CarsSnapshot) => {
    current = snapshot;
    lastError = null;
    emit({ type: 'snapshot', snapshot });
  };

  const refresh = (): Promise<void> => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      if (current && current.freshness !== 'refreshing') {
        setSnapshot({ ...current, freshness: 'refreshing' });
      }
      try {
        const cars = await fetchCars();
        const fetchedAt = new Date();
        try {
          await cache.write(cars, fetchedAt);
        } catch {
          // A failed cache write costs offline availability later, not the fresh data now.
        }
        setSnapshot({ cars, fetchedAt: fetchedAt.toISOString(), freshness: 'fresh' });
      } catch (thrown) {
        if (current) {
          setSnapshot({ ...current, freshness: 'stale' });
        } else {
          lastError = toError(thrown);
          emit({ type: 'error', error: lastError });
        }
      }
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  /** First use: show the cache (if any), then refresh. Runs once per app session. */
  const start = (): Promise<void> => {
    if (!started) {
      started = (async () => {
        const cached = await cache.read();
        if (cached && !current) {
          setSnapshot({ ...cached, freshness: 'refreshing' });
        }
        await refresh();
      })();
    }
    return started;
  };

  return {
    subscribeCars(listener) {
      listeners.add(listener);
      if (current) listener({ type: 'snapshot', snapshot: current });
      else if (lastError) listener({ type: 'error', error: lastError });
      void start();
      return () => {
        listeners.delete(listener);
      };
    },

    refreshCars() {
      return started ? refresh() : start();
    },

    async getCarById(id) {
      if (!current) {
        const cached = await cache.read();
        if (cached) {
          current = { ...cached, freshness: 'stale' };
        } else {
          await (started ?? start());
        }
      }
      if (!current) throw lastError ?? new CarNotFoundError(id);
      const car = current.cars.find((candidate) => candidate.id === id);
      if (!car) throw new CarNotFoundError(id);
      return { ...car };
    },
  };
}

export const carRepository: CarRepository = createCarRepository({
  fetchCars: fetchCarsFromApi,
  cache: carCache,
});
