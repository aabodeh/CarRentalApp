import { useSyncExternalStore } from 'react';

import { profileRepository, type ProfileSnapshot } from '../repositories/profileRepository';
import type { UserProfile } from '../types';

export type UseProfileResult = {
  /** `loading` until the profile has been read from the phone; then the profile, or null. */
  state: ProfileSnapshot;
  /** Validates and saves. Rejects with `InvalidProfileError`, or with the storage error. */
  save: (profile: UserProfile) => Promise<UserProfile>;
};

/** The user's profile on this phone (no account). Used by Profile and to prefill a booking. */
export function useProfile(): UseProfileResult {
  const state = useSyncExternalStore(profileRepository.subscribe, profileRepository.getSnapshot);
  return { state, save: profileRepository.save };
}
