import { cars as dummyCars } from '../../src/data/dummy/cars';
import {
  CarNotFoundError,
  SIMULATED_LATENCY_MS,
  carRepository,
} from '../../src/repositories/carRepository';

describe('carRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('answers asynchronously, after the simulated network latency', async () => {
    const onResolve = jest.fn();
    carRepository.getCars().then(onResolve);

    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS - 1);
    expect(onResolve).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(onResolve).toHaveBeenCalled();
  });

  it('returns every car', async () => {
    const result = carRepository.getCars();
    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS);

    await expect(result).resolves.toEqual(dummyCars);
  });

  it('returns a copy, so a caller cannot change the source data', async () => {
    const result = carRepository.getCars();
    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS);
    const cars = await result;

    cars.pop();
    cars[0].pricePerDay = 1;

    expect(dummyCars).toHaveLength(10);
    expect(dummyCars[0].pricePerDay).not.toBe(1);
  });

  it('returns the car with the requested id', async () => {
    const result = carRepository.getCarById('car-05');
    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS);

    await expect(result).resolves.toMatchObject({ id: 'car-05', make: 'Tesla' });
  });

  it('throws CarNotFoundError for an id that does not exist', async () => {
    const result = carRepository.getCarById('car-404');
    const assertion = expect(result).rejects.toThrow(CarNotFoundError);
    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS);

    await assertion;
    await expect(result).rejects.toMatchObject({ carId: 'car-404' });
  });
});
