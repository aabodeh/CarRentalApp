import AsyncStorage from '@react-native-async-storage/async-storage';

import { createFavouritesRepository } from '../../src/repositories/favouritesRepository';
import { favouritesStore } from '../../src/storage/favouritesStore';

/** Lets the stored ids be read (the repository reads on first subscription). */
const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

function start(store = favouritesStore) {
  const repository = createFavouritesRepository({ store });
  const onChange = jest.fn();
  repository.subscribe(onChange);
  return { repository, onChange };
}

describe('favouritesRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves a car, and removes it on a second toggle', async () => {
    const { repository } = start();

    await repository.toggle('car-05');
    expect([...repository.getIds()]).toEqual(['car-05']);

    await repository.toggle('car-05');
    expect([...repository.getIds()]).toEqual([]);
  });

  it('keeps favourites across a restart of the app', async () => {
    const before = start().repository;
    await before.toggle('car-05');
    await before.toggle('car-01');

    const { repository: after } = start();
    await flush();

    expect([...after.getIds()]).toEqual(['car-05', 'car-01']);
  });

  it('does not lose stored favourites to a toggle made before they were read', async () => {
    await favouritesStore.write(['car-01']);
    const { repository } = start();

    await repository.toggle('car-05');

    expect([...repository.getIds()]).toEqual(['car-01', 'car-05']);
    expect(await favouritesStore.read()).toEqual(['car-01', 'car-05']);
  });

  it('tells subscribers nothing when nothing is stored, because nothing changed', async () => {
    const { onChange } = start();
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes several cars at once', async () => {
    await favouritesStore.write(['car-01', 'car-05', 'car-07']);
    const { repository } = start();

    await repository.remove(['car-01', 'car-07']);

    expect(await favouritesStore.read()).toEqual(['car-05']);
  });

  it('undoes a change that could not be saved, and reports the failure', async () => {
    const { repository } = start({
      read: async () => [],
      write: async () => {
        throw new Error('disk full');
      },
    });

    await expect(repository.toggle('car-05')).rejects.toThrow('disk full');

    expect([...repository.getIds()]).toEqual([]);
  });
});
