import { act, renderHook, waitFor } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import { useCars } from '../../src/hooks/useCars';
import { carRepository } from '../../src/repositories/carRepository';

/** A promise the test resolves by hand, to control exactly when the "network" answers. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useCars', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in the loading state', () => {
    jest.spyOn(carRepository, 'getCars').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCars());

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('is ready with the cars once the repository answers', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue(cars);

    const { result } = renderHook(() => useCars());

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', cars }));
  });

  it('is empty when the repository returns no cars', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue([]);

    const { result } = renderHook(() => useCars());

    await waitFor(() => expect(result.current.state).toEqual({ status: 'empty' }));
  });

  it('reports an error, and recovers when retry succeeds', async () => {
    jest
      .spyOn(carRepository, 'getCars')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(cars);
    const { result } = renderHook(() => useCars());
    await waitFor(() => expect(result.current.state.status).toBe('error'));

    const state = result.current.state;
    if (state.status !== 'error') throw new Error('expected error state');
    expect(state.error.message).toBe('offline');
    act(() => state.retry());

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', cars }));
  });

  it('keeps showing the list while refreshing, and updates it when the refresh lands', async () => {
    const refreshed = cars.slice(0, 2);
    const pending = deferred<typeof cars>();
    jest
      .spyOn(carRepository, 'getCars')
      .mockResolvedValueOnce(cars)
      .mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useCars());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.refresh());

    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.state).toEqual({ status: 'ready', cars });

    await act(async () => pending.resolve(refreshed));

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.state).toEqual({ status: 'ready', cars: refreshed });
  });

  it('keeps the current list when a refresh fails', async () => {
    jest
      .spyOn(carRepository, 'getCars')
      .mockResolvedValueOnce(cars)
      .mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useCars());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    act(() => result.current.refresh());

    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    expect(result.current.state).toEqual({ status: 'ready', cars });
  });

  it('ignores an answer that arrives after the screen has gone away', async () => {
    const pending = deferred<typeof cars>();
    jest.spyOn(carRepository, 'getCars').mockReturnValue(pending.promise);
    const consoleError = jest.spyOn(console, 'error');
    const { result, unmount } = renderHook(() => useCars());

    unmount();
    await act(async () => pending.resolve(cars));

    expect(result.current.state).toEqual({ status: 'loading' });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
