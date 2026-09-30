import { cars } from '../../src/data/dummy/cars';
import type { Fuel, Transmission } from '../../src/types';
import { filterCars, isEmptyFilter, type CarFilter } from '../../src/utils/filterCars';

const filter = (overrides: Partial<CarFilter> = {}): CarFilter => ({
  query: '',
  fuels: new Set<Fuel>(),
  transmissions: new Set<Transmission>(),
  ...overrides,
});

const ids = (result: { id: string }[]) => result.map((car) => car.id);

describe('filterCars', () => {
  it('lets every car through, in order, when nothing is chosen', () => {
    expect(filterCars(cars, filter())).toEqual(cars);
  });

  it('finds cars by make, ignoring case and outer spaces', () => {
    expect(ids(filterCars(cars, filter({ query: '  volkswagen ' })))).toEqual([
      'car-02',
      'car-03',
      'car-10',
    ]);
  });

  it('finds cars by model, and by make and model together', () => {
    expect(ids(filterCars(cars, filter({ query: 'model 3' })))).toEqual(['car-05']);
    expect(ids(filterCars(cars, filter({ query: 'Tesla Model' })))).toEqual(['car-05']);
  });

  it('shows cars with any of the chosen fuels', () => {
    const result = filterCars(cars, filter({ fuels: new Set<Fuel>(['electric', 'hybrid']) }));

    expect(ids(result)).toEqual(['car-01', 'car-05', 'car-06', 'car-08']);
  });

  it('requires a match in every chip group', () => {
    const result = filterCars(
      cars,
      filter({
        fuels: new Set<Fuel>(['petrol']),
        transmissions: new Set<Transmission>(['manual']),
      })
    );

    expect(ids(result)).toEqual(['car-02', 'car-03', 'car-04']);
  });

  it('combines the search with the chips', () => {
    const result = filterCars(
      cars,
      filter({ query: 'volkswagen', fuels: new Set<Fuel>(['diesel']) })
    );

    expect(ids(result)).toEqual(['car-10']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterCars(cars, filter({ query: 'trabant' }))).toEqual([]);
  });
});

describe('isEmptyFilter', () => {
  it('is empty with a blank search and no chips', () => {
    expect(isEmptyFilter(filter({ query: '   ' }))).toBe(true);
  });

  it('is not empty once anything is chosen', () => {
    expect(isEmptyFilter(filter({ query: 'a' }))).toBe(false);
    expect(isEmptyFilter(filter({ fuels: new Set<Fuel>(['diesel']) }))).toBe(false);
  });
});
