import { act, renderHook, waitFor } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import { useCar } from '../../src/hooks/useCar';
import { CarNotFoundError, carRepository } from '../../src/repositories/carRepository';

describe('useCar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in the loading state', () => {
    jest.spyOn(carRepository, 'getCarById').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCar('car-05'));

    expect(result.current).toEqual({ status: 'loading' });
  });

  it('is ready with the requested car', async () => {
    jest.spyOn(carRepository, 'getCarById').mockResolvedValue(cars[4]);

    const { result } = renderHook(() => useCar('car-05'));

    await waitFor(() => expect(result.current).toEqual({ status: 'ready', car: cars[4] }));
    expect(carRepository.getCarById).toHaveBeenCalledWith('car-05');
  });

  it('reports not-found, distinct from an error, when the car does not exist', async () => {
    jest.spyOn(carRepository, 'getCarById').mockRejectedValue(new CarNotFoundError('car-404'));

    const { result } = renderHook(() => useCar('car-404'));

    await waitFor(() => expect(result.current).toEqual({ status: 'not-found' }));
  });

  it('reports an error, and recovers when retry succeeds', async () => {
    jest
      .spyOn(carRepository, 'getCarById')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(cars[4]);
    const { result } = renderHook(() => useCar('car-05'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    const state = result.current;
    if (state.status !== 'error') throw new Error('expected error state');
    act(() => state.retry());

    await waitFor(() => expect(result.current).toEqual({ status: 'ready', car: cars[4] }));
  });

  it('loads the new car when the id changes', async () => {
    jest
      .spyOn(carRepository, 'getCarById')
      .mockImplementation(async (id) => cars.find((car) => car.id === id)!);
    const { result, rerender } = renderHook(({ id }: { id: string }) => useCar(id), {
      initialProps: { id: 'car-01' },
    });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', car: cars[0] }));

    rerender({ id: 'car-02' });

    await waitFor(() => expect(result.current).toEqual({ status: 'ready', car: cars[1] }));
  });
});
