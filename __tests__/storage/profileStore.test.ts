import AsyncStorage from '@react-native-async-storage/async-storage';

import { profileStore } from '../../src/storage/profileStore';

describe('profileStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reads as no profile when nothing is stored', async () => {
    expect(await profileStore.read()).toBeNull();
  });

  it('reads back what was written, under carrental.v2.profile', async () => {
    const profile = { name: 'Mette', email: 'mette@example.dk', preferredLocation: 'Odense C' };

    await profileStore.write(profile);

    expect(await profileStore.read()).toEqual(profile);
    expect(await AsyncStorage.getItem('carrental.v2.profile')).toContain('mette@example.dk');
  });

  it('treats a profile of the wrong shape as no profile, and removes it', async () => {
    await AsyncStorage.setItem(
      'carrental.v2.profile',
      JSON.stringify({ version: 2, savedAt: '2026-09-30T10:00:00.000Z', data: { name: 42 } })
    );

    expect(await profileStore.read()).toBeNull();
    expect(await AsyncStorage.getItem('carrental.v2.profile')).toBeNull();
  });
});
