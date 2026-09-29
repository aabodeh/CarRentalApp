import seed from '../../../docs/api/cars.seed.json';
import { cars } from '../../../src/data/dummy/cars';

/**
 * docs/api/cars.seed.json is what was pasted into MockAPI. It is generated from the dummy cars,
 * minus `id` (MockAPI assigns its own). If this fails, the two have drifted: regenerate the seed
 * and re-seed MockAPI, or the app and the API describe different cars.
 */
describe('MockAPI seed', () => {
  it('matches the dummy cars exactly, apart from the id', () => {
    expect(seed).toEqual(cars.map(({ id: _id, ...rest }) => rest));
  });
});
