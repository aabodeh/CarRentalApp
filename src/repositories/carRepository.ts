import { cars as dummyCars } from '../data/dummy/cars';
import type { Car } from '../types';

/**
 * TEMPORARY: remove when the API lands. Dummy data answers after a short delay so the UI has
 * real loading states today, and nothing above this file changes when the network arrives.
 */
export const SIMULATED_LATENCY_MS = 400;

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

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Copies, so a caller mutating a result cannot corrupt the source data. */
const copy = (car: Car): Car => ({ ...car });

export const carRepository: CarRepository = {
  async getCars() {
    await wait(SIMULATED_LATENCY_MS);
    return dummyCars.map(copy);
  },

  async getCarById(id) {
    await wait(SIMULATED_LATENCY_MS);
    const car = dummyCars.find((candidate) => candidate.id === id);
    if (!car) {
      throw new CarNotFoundError(id);
    }
    return copy(car);
  },
};
