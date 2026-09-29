import { act, renderHook } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import { useCars } from '../../src/hooks/useCars';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';

describe('useCars', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    setOnline();
  });

  it('starts in the loading state', () => {
    stubCarRepository();

    const { result } = renderHook(() => useCars());

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('is ready with the cars, their age and freshness', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCars());

    repo.emitCars(cars, { fetchedAt: '2026-09-29T08:00:00.000Z', freshness: 'stale' });

    expect(result.current.state).toEqual({
      status: 'ready',
      cars,
      fetchedAt: '2026-09-29T08:00:00.000Z',
      freshness: 'stale',
    });
  });

  it('shows cached cars, then replaces them when fresh ones arrive', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCars());

    repo.emitCars(cars, { freshness: 'refreshing' });
    repo.emitCars(cars.slice(0, 2), { freshness: 'fresh' });

    expect(result.current.state).toMatchObject({
      status: 'ready',
      cars: cars.slice(0, 2),
      freshness: 'fresh',
    });
  });

  it('is empty when the repository has no cars', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCars());

    repo.emitCars([]);

    expect(result.current.state.status).toBe('empty');
  });

  it('reports an error, and asks the repository again on retry', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCars());
    repo.emitError(new Error('offline'));

    const state = result.current.state;
    if (state.status !== 'error') throw new Error('expected error state');
    act(() => state.retry());

    expect(result.current.state).toEqual({ status: 'loading' });
    expect(repo.refresh).toHaveBeenCalledTimes(1);
  });

  it('reports refreshing while a pull-to-refresh runs', async () => {
    const repo = stubCarRepository();
    let finish!: () => void;
    repo.refresh.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useCars());

    act(() => result.current.refresh());
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => finish());
    expect(result.current.isRefreshing).toBe(false);
  });

  it('refreshes by itself when the connection comes back', () => {
    const repo = stubCarRepository();
    setOffline();
    const { rerender } = renderHook(() => useCars());
    expect(repo.refresh).not.toHaveBeenCalled();

    setOnline();
    rerender({});

    expect(repo.refresh).toHaveBeenCalledTimes(1);
  });

  it('stops listening when the screen goes away', () => {
    const repo = stubCarRepository();
    const { unmount } = renderHook(() => useCars());
    expect(repo.listenerCount()).toBe(1);

    unmount();

    expect(repo.listenerCount()).toBe(0);
  });
});
