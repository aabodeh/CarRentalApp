import { cars } from '../../../src/data/dummy/cars';
import type { Car } from '../../../src/types';

const TRANSMISSIONS: readonly Car['transmission'][] = ['manual', 'automatic'];
const FUELS: readonly Car['fuel'][] = ['petrol', 'diesel', 'electric', 'hybrid'];

/**
 * Runtime check of the `Car` shape. TypeScript already checks the literal, but this also catches
 * values the type allows and the domain does not (negative prices, empty strings) — and it is the
 * guard the API response will need later.
 */
function isValidCar(value: Car): boolean {
  const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
  return (
    nonEmpty(value.id) &&
    nonEmpty(value.make) &&
    nonEmpty(value.model) &&
    nonEmpty(value.location) &&
    Number.isInteger(value.year) &&
    value.year >= 2000 &&
    Number.isFinite(value.pricePerDay) &&
    value.pricePerDay > 0 &&
    Number.isInteger(value.seats) &&
    value.seats > 0 &&
    TRANSMISSIONS.includes(value.transmission) &&
    FUELS.includes(value.fuel) &&
    typeof value.available === 'boolean' &&
    /^https:\/\//.test(value.imageUrl)
  );
}

describe('dummy cars', () => {
  it('has ten cars', () => {
    expect(cars).toHaveLength(10);
  });

  it.each(cars.map((car) => [car.id, car] as const))('%s satisfies the Car shape', (_id, car) => {
    expect(isValidCar(car)).toBe(true);
  });

  it('gives every car a unique id', () => {
    expect(new Set(cars.map((car) => car.id)).size).toBe(cars.length);
  });

  it('includes at least one unavailable car, so the disabled state can be exercised', () => {
    expect(cars.some((car) => !car.available)).toBe(true);
  });

  it('covers every fuel type', () => {
    expect(new Set(cars.map((car) => car.fuel))).toEqual(new Set(FUELS));
  });
});
