import { cars } from '../../src/data/dummy/cars';
import {
  CarNotFoundError,
  createCarRepository,
  type CarsEvent,
} from '../../src/repositories/carRepository';
import { ApiNetworkError } from '../../src/services/api/client';
import type { Car } from '../../src/types';

type Cached = { cars: Car[]; fetchedAt: string };

/** A controllable stand-in for the cache and the API. */
function setup({ cached = null as Cached | null } = {}) {
  let stored = cached;
  const cache = {
    read: jest.fn(async () => stored),
    write: jest.fn(async (next: Car[], at: Date = new Date()) => {
      stored = { cars: next, fetchedAt: at.toISOString() };
    }),
  };
  const fetchCars = jest.fn<Promise<Car[]>, []>();
  const repository = createCarRepository({ fetchCars, cache });
  const events: CarsEvent[] = [];
  return { repository, cache, fetchCars, events, listen: (e: CarsEvent) => events.push(e) };
}

/** Lets every pending promise settle. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const CACHED_AT = '2026-09-29T08:00:00.000Z';
const newer = cars.slice(0, 3);

describe('carRepository (cache, then refresh)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-09-29T10:00:00.000Z'), doNotFake: ['setTimeout'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('serves cached cars instantly, before the network answers', async () => {
    const { repository, fetchCars, events, listen } = setup({
      cached: { cars, fetchedAt: CACHED_AT },
    });
    fetchCars.mockReturnValue(new Promise(() => {}));

    repository.subscribeCars(listen);
    await flush();

    expect(events).toEqual([
      { type: 'snapshot', snapshot: { cars, fetchedAt: CACHED_AT, freshness: 'refreshing' } },
    ]);
  });

  it('refreshes in the background and replaces the cached cars with fresh ones', async () => {
    const { repository, fetchCars, cache, events, listen } = setup({
      cached: { cars, fetchedAt: CACHED_AT },
    });
    fetchCars.mockResolvedValue(newer);

    repository.subscribeCars(listen);
    await flush();

    expect(events.at(-1)).toEqual({
      type: 'snapshot',
      snapshot: { cars: newer, fetchedAt: '2026-09-29T10:00:00.000Z', freshness: 'fresh' },
    });
    expect(cache.write).toHaveBeenCalledWith(newer, expect.any(Date));
  });

  it('keeps serving the cache, marked stale, when the API fails', async () => {
    const { repository, fetchCars, events, listen } = setup({
      cached: { cars, fetchedAt: CACHED_AT },
    });
    fetchCars.mockRejectedValue(new ApiNetworkError(new Error('offline')));

    repository.subscribeCars(listen);
    await flush();

    expect(events.at(-1)).toEqual({
      type: 'snapshot',
      snapshot: { cars, fetchedAt: CACHED_AT, freshness: 'stale' },
    });
    expect(events.some((event) => event.type === 'error')).toBe(false);
  });

  it('reports an error when the API fails and there is no cache', async () => {
    const { repository, fetchCars, events, listen } = setup();
    const error = new ApiNetworkError(new Error('offline'));
    fetchCars.mockRejectedValue(error);

    repository.subscribeCars(listen);
    await flush();

    expect(events).toEqual([{ type: 'error', error }]);
  });

  it('recovers from that error when a refresh succeeds', async () => {
    const { repository, fetchCars, events, listen } = setup();
    fetchCars.mockRejectedValueOnce(new ApiNetworkError(new Error('offline')));
    fetchCars.mockResolvedValueOnce(cars);
    repository.subscribeCars(listen);
    await flush();

    await repository.refreshCars();

    expect(events.at(-1)).toMatchObject({
      type: 'snapshot',
      snapshot: { cars, freshness: 'fresh' },
    });
  });

  it('gives a late subscriber the current cars without fetching again', async () => {
    const { repository, fetchCars, listen } = setup();
    fetchCars.mockResolvedValue(cars);
    repository.subscribeCars(listen);
    await flush();

    const late: CarsEvent[] = [];
    repository.subscribeCars((event) => late.push(event));

    expect(late).toEqual([
      { type: 'snapshot', snapshot: expect.objectContaining({ cars, freshness: 'fresh' }) },
    ]);
    expect(fetchCars).toHaveBeenCalledTimes(1);
  });

  it('stops telling a listener about changes once it unsubscribes', async () => {
    const { repository, fetchCars, events, listen } = setup();
    fetchCars.mockResolvedValue(cars);
    const unsubscribe = repository.subscribeCars(listen);
    unsubscribe();

    await flush();

    expect(events).toEqual([]);
  });

  it('shares one request when a refresh is asked for while one is running', async () => {
    const { repository, fetchCars } = setup();
    fetchCars.mockResolvedValue(cars);

    await Promise.all([repository.refreshCars(), repository.refreshCars()]);

    expect(fetchCars).toHaveBeenCalledTimes(1);
  });

  it('still serves fresh cars when writing the cache fails', async () => {
    const { repository, fetchCars, cache, events, listen } = setup();
    fetchCars.mockResolvedValue(cars);
    cache.write.mockRejectedValue(new Error('disk full'));

    repository.subscribeCars(listen);
    await flush();

    expect(events.at(-1)).toMatchObject({ type: 'snapshot', snapshot: { freshness: 'fresh' } });
  });

  describe('getCarById', () => {
    it('answers from the cache without the network, so booking works offline', async () => {
      const { repository, fetchCars } = setup({ cached: { cars, fetchedAt: CACHED_AT } });
      fetchCars.mockRejectedValue(new ApiNetworkError(new Error('offline')));

      await expect(repository.getCarById('car-05')).resolves.toMatchObject({ make: 'Tesla' });
    });

    it('fetches when there is no cache yet', async () => {
      const { repository, fetchCars } = setup();
      fetchCars.mockResolvedValue(cars);

      await expect(repository.getCarById('car-05')).resolves.toMatchObject({ make: 'Tesla' });
    });

    it('throws CarNotFoundError for an id that is not in the list', async () => {
      const { repository, fetchCars } = setup();
      fetchCars.mockResolvedValue(cars);

      await expect(repository.getCarById('car-404')).rejects.toThrow(CarNotFoundError);
    });

    it('throws the network error when there is neither cache nor network', async () => {
      const { repository, fetchCars } = setup();
      fetchCars.mockRejectedValue(new ApiNetworkError(new Error('offline')));

      await expect(repository.getCarById('car-05')).rejects.toThrow(ApiNetworkError);
    });
  });
});
