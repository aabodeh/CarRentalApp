import type { Car } from '../types';

/** Display words for a car's enum fields. One place, so the list and the details agree. */
export const TRANSMISSION_LABEL: Record<Car['transmission'], string> = {
  manual: 'Manual',
  automatic: 'Automatic',
};

export const FUEL_LABEL: Record<Car['fuel'], string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
};

/** Shown wherever a car cannot be booked. `Car` has no reason field, so this is all we can say. */
export const UNAVAILABLE_TEXT = 'Not available right now';

/**
 * The name to show for a booked car: "Tesla Model 3" from the cars known on this phone, or
 * "Car car-05" when that car is not among them (e.g. the car list was never loaded).
 */
export function bookedCarName(cars: readonly Car[], carId: string): string {
  const car = cars.find((candidate) => candidate.id === carId);
  return car ? `${car.make} ${car.model}` : `Car ${carId}`;
}
