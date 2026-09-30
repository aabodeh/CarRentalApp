import AsyncStorage from '@react-native-async-storage/async-storage';

import { favouritesStore } from '../../src/storage/favouritesStore';

describe('favouritesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reads as no favourites when nothing is stored', async () => {
    expect(await favouritesStore.read()).toEqual([]);
  });

  it('reads back the ids that were written, under carrental.v2.favourites', async () => {
    await favouritesStore.write(['car-05', 'car-01']);

    expect(await favouritesStore.read()).toEqual(['car-05', 'car-01']);
    expect(await AsyncStorage.getItem('carrental.v2.favourites')).toContain('car-05');
  });

  it('treats corrupt data as no favourites, and removes it', async () => {
    await AsyncStorage.setItem('carrental.v2.favourites', 'not json');

    expect(await favouritesStore.read()).toEqual([]);
    expect(await AsyncStorage.getItem('carrental.v2.favourites')).toBeNull();
  });
});
