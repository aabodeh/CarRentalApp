import {
  createFavouritesRepository,
  favouritesRepository,
} from '../../src/repositories/favouritesRepository';

/**
 * Points the shared favouritesRepository at a fresh in-memory one holding `saved`, so each test
 * starts from its own favourites. The real repository logic still runs. Restored by
 * `jest.restoreAllMocks()`. The stored ids are read asynchronously, as on a phone: let promises
 * settle (inside act) before asserting on hearts.
 */
export function stubFavourites(saved: string[] = []) {
  let stored = [...saved];
  const write = jest.fn(async (carIds: string[]) => {
    stored = carIds;
  });
  const fake = createFavouritesRepository({ store: { read: async () => stored, write } });

  jest.spyOn(favouritesRepository, 'subscribe').mockImplementation(fake.subscribe);
  jest.spyOn(favouritesRepository, 'getIds').mockImplementation(fake.getIds);
  jest.spyOn(favouritesRepository, 'toggle').mockImplementation(fake.toggle);
  jest.spyOn(favouritesRepository, 'remove').mockImplementation(fake.remove);

  return { write, stored: () => stored };
}
