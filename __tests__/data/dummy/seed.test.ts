import seed from '../../../docs/api/cars.seed.json';
import { cars } from '../../../src/data/dummy/cars';
import { isCarArray } from '../../../src/types/guards';

/**
 * docs/api/cars.seed.json is what gets pasted into MockAPI's data editor. It is the dummy cars
 * with MockAPI-style ids "1"…"10" in place of our "car-01"… ids. The ids must be in the seed:
 * MockAPI's data editor stores pasted JSON as-is and does not add them (FL-015).
 *
 * If this fails, the seed and the dummy cars have drifted: regenerate the seed and re-seed MockAPI.
 */
describe('MockAPI seed', () => {
  it('matches the dummy cars, with ids "1" to "10"', () => {
    expect(seed).toEqual(cars.map((car, i) => ({ ...car, id: String(i + 1) })));
  });

  it('passes the same guard the app applies to API replies', () => {
    expect(isCarArray(seed)).toBe(true);
  });
});
