import { act, renderHook } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import { useCar } from '../../src/hooks/useCar';
import { stubCarRepository } from '../helpers/carRepositoryStub';

describe('useCar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in the loading state', () => {
    stubCarRepository();

    const { result } = renderHook(() => useCar('car-05'));

    expect(result.current).toEqual({ status: 'loading' });
  });

  it('is ready with the requested car and how old the data is', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCar('car-05'));

    repo.emitCars(cars, { fetchedAt: '2026-09-29T08:00:00.000Z', freshness: 'stale' });

    expect(result.current).toEqual({
      status: 'ready',
      car: cars[4],
      fetchedAt: '2026-09-29T08:00:00.000Z',
      freshness: 'stale',
    });
  });

  it('reports not-found, distinct from an error, when the car is not in the list', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCar('car-404'));

    repo.emitCars(cars);

    expect(result.current).toEqual({ status: 'not-found' });
  });

  it('reports an error with retry when there are no cars at all', () => {
    const repo = stubCarRepository();
    const { result } = renderHook(() => useCar('car-05'));
    repo.emitError(new Error('offline'));

    const state = result.current;
    if (state.status !== 'error') throw new Error('expected error state');
    act(() => state.retry());

    expect(result.current).toEqual({ status: 'loading' });
    expect(repo.refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the new car when the id changes', () => {
    const repo = stubCarRepository();
    const { result, rerender } = renderHook(({ id }: { id: string }) => useCar(id), {
      initialProps: { id: 'car-01' },
    });
    repo.emitCars(cars);

    rerender({ id: 'car-02' });

    expect(result.current).toMatchObject({ status: 'ready', car: cars[1] });
  });
});
