import type { Car, Fuel, Transmission } from '../types';

export type CarFilter = {
  /** Matched against make, model and "make model", ignoring case and outer spaces. */
  query: string;
  /** Empty means any fuel. Several means any of them. */
  fuels: ReadonlySet<Fuel>;
  /** Empty means any transmission. Several means any of them. */
  transmissions: ReadonlySet<Transmission>;
};

/** True when the filter would let every car through. */
export function isEmptyFilter({ query, fuels, transmissions }: CarFilter): boolean {
  return query.trim() === '' && fuels.size === 0 && transmissions.size === 0;
}

/**
 * The cars that match the search and every chip group: a car must match the search, *one of* the
 * chosen fuels and *one of* the chosen transmissions. The list keeps its order.
 */
export function filterCars(cars: readonly Car[], filter: CarFilter): Car[] {
  const query = filter.query.trim().toLowerCase();

  return cars.filter((car) => {
    const name = `${car.make} ${car.model}`.toLowerCase();
    if (query !== '' && !name.includes(query)) return false;
    if (filter.fuels.size > 0 && !filter.fuels.has(car.fuel)) return false;
    if (filter.transmissions.size > 0 && !filter.transmissions.has(car.transmission)) return false;
    return true;
  });
}
