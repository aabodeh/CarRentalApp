import { cars as dummyCars } from '../data/dummy/cars';
import type { Car } from '../types';
import { simulateLatency } from './simulatedLatency';

export { SIMULATED_LATENCY_MS } from './simulatedLatency';

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
 * The contract every car data source implements. Today: dummy data. Later: API + local cache
 * (K1), behind this same shape, so no hook or screen changes.
 */
export type CarRepository = {
  getCars(): Promise<Car[]>;
  getCarById(id: string): Promise<Car>;
};

/** Copies, so a caller mutating a result cannot corrupt the source data. */
const copy = (car: Car): Car => ({ ...car });

export const carRepository: CarRepository = {
  async getCars() {
    await simulateLatency();
    return dummyCars.map(copy);
  },

  async getCarById(id) {
    await simulateLatency();
    const car = dummyCars.find((candidate) => candidate.id === id);
    if (!car) {
      throw new CarNotFoundError(id);
    }
    return copy(car);
  },
};
