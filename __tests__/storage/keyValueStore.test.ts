import AsyncStorage from '@react-native-async-storage/async-storage';

import { cars } from '../../src/data/dummy/cars';
import { carCache } from '../../src/storage/carCache';
import { readJson, storageKey, writeJson } from '../../src/storage/keyValueStore';
import { isCarArray } from '../../src/types/guards';

describe('keyValueStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('namespaces and versions every key', () => {
    expect(storageKey('cars')).toBe('carrental.v1.cars');
  });

  it('reads back exactly what it wrote, with the time it was saved', async () => {
    await writeJson('cars', cars, new Date('2026-09-29T10:00:00.000Z'));

    await expect(readJson('cars', isCarArray)).resolves.toEqual({
      data: cars,
      savedAt: '2026-09-29T10:00:00.000Z',
    });
  });

  it('reads nothing when nothing was stored', async () => {
    await expect(readJson('cars', isCarArray)).resolves.toBeNull();
  });

  it('treats corrupt JSON as nothing stored, and removes it, instead of crashing', async () => {
    await AsyncStorage.setItem('carrental.v1.cars', '{"version":1,"savedAt":');

    await expect(readJson('cars', isCarArray)).resolves.toBeNull();
    await expect(AsyncStorage.getItem('carrental.v1.cars')).resolves.toBeNull();
  });

  it('discards data written by a different storage version', async () => {
    await AsyncStorage.setItem(
      'carrental.v1.cars',
      JSON.stringify({ version: 2, savedAt: '2026-09-29T10:00:00.000Z', data: cars })
    );

    await expect(readJson('cars', isCarArray)).resolves.toBeNull();
    await expect(AsyncStorage.getItem('carrental.v1.cars')).resolves.toBeNull();
  });

  it('discards stored data that no longer has the expected shape', async () => {
    await AsyncStorage.setItem(
      'carrental.v1.cars',
      JSON.stringify({ version: 1, savedAt: '2026-09-29T10:00:00.000Z', data: [{ id: 'x' }] })
    );

    await expect(readJson('cars', isCarArray)).resolves.toBeNull();
  });

  it('treats a storage read failure as nothing stored', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));

    await expect(readJson('cars', isCarArray)).resolves.toBeNull();
  });
});

describe('carCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('stores the cars with the time they were fetched', async () => {
    await carCache.write(cars, new Date('2026-09-29T10:00:00.000Z'));

    await expect(carCache.read()).resolves.toEqual({
      cars,
      fetchedAt: '2026-09-29T10:00:00.000Z',
    });
  });
});
