import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createProfileRepository,
  InvalidProfileError,
} from '../../src/repositories/profileRepository';
import { profileStore } from '../../src/storage/profileStore';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

function start() {
  const repository = createProfileRepository({ store: profileStore });
  repository.subscribe(jest.fn());
  return repository;
}

describe('profileRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('is loading until the profile has been read, then ready with none', async () => {
    const repository = start();
    expect(repository.getSnapshot()).toEqual({ status: 'loading' });

    await flush();

    expect(repository.getSnapshot()).toEqual({ status: 'ready', profile: null });
  });

  it('keeps the profile across a restart of the app, trimmed', async () => {
    await start().save({ name: ' Mette ', email: 'mette@example.dk ', preferredLocation: '' });

    const after = start();
    await flush();

    expect(after.getSnapshot()).toEqual({
      status: 'ready',
      profile: { name: 'Mette', email: 'mette@example.dk' },
    });
  });

  it('refuses a profile the booking form would refuse, with the same messages', async () => {
    const repository = start();

    const saving = repository.save({ name: '', email: 'mette@' });

    await expect(saving).rejects.toBeInstanceOf(InvalidProfileError);
    await expect(saving).rejects.toMatchObject({
      errors: {
        renterName: 'Enter your name.',
        renterEmail: 'Enter a valid email address, like name@example.com.',
      },
    });
    expect(await profileStore.read()).toBeNull();
  });

  it('is not overwritten by a slow first read that finishes after a save', async () => {
    let finishRead: (value: null) => void = () => undefined;
    const repository = createProfileRepository({
      store: {
        read: () => new Promise((resolve) => (finishRead = resolve)),
        write: async () => undefined,
      },
    });
    repository.subscribe(jest.fn());

    await repository.save({ name: 'Mette', email: 'mette@example.dk' });
    finishRead(null);
    await flush();

    expect(repository.getSnapshot()).toEqual({
      status: 'ready',
      profile: { name: 'Mette', email: 'mette@example.dk' },
    });
  });
});
