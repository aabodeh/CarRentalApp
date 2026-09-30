import type { UserProfile } from '../types';
import { isUserProfile } from '../types/guards';
import { readJson, writeJson } from './keyValueStore';

/** The user's profile on this phone, or null if none has been saved. Key: `carrental.v2.profile`. */
export const profileStore = {
  async read(): Promise<UserProfile | null> {
    const stored = await readJson('profile', isUserProfile);
    return stored ? stored.data : null;
  },

  write(profile: UserProfile): Promise<void> {
    return writeJson('profile', profile);
  },
};
