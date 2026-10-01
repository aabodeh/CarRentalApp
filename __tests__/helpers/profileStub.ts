import {
  createProfileRepository,
  profileRepository,
} from '../../src/repositories/profileRepository';
import type { UserProfile } from '../../src/types';

/**
 * Points the shared profileRepository at a fresh in-memory one holding `saved`. Restored by
 * `jest.restoreAllMocks()`. The profile is read asynchronously, as on a phone.
 */
export function stubProfile(saved: UserProfile | null = null) {
  let stored = saved;
  const write = jest.fn(async (profile: UserProfile) => {
    stored = profile;
  });
  const fake = createProfileRepository({ store: { read: async () => stored, write } });

  jest.spyOn(profileRepository, 'subscribe').mockImplementation(fake.subscribe);
  jest.spyOn(profileRepository, 'getSnapshot').mockImplementation(fake.getSnapshot);
  jest.spyOn(profileRepository, 'save').mockImplementation(fake.save);

  return { write, stored: () => stored };
}
