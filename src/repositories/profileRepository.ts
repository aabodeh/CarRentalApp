import { profileStore } from '../storage/profileStore';
import type { UserProfile } from '../types';
import { validateRenter, type RenterErrors } from '../utils/validateRenter';

/** Thrown by `save` when the name or email fails the same rules as the booking form. */
export class InvalidProfileError extends Error {
  readonly errors: RenterErrors;

  constructor(errors: RenterErrors) {
    super('The profile is not valid');
    this.name = 'InvalidProfileError';
    this.errors = errors;
  }
}

/**
 * Whether the profile has been read from the phone yet, and what it is. `profile` is null when
 * none has been saved.
 */
export type ProfileSnapshot =
  { status: 'loading' } | { status: 'ready'; profile: UserProfile | null };

/**
 * The user's profile on this phone. Local only: no account, no API. Its name and email reach the
 * server only as part of a booking.
 *
 * Shaped for `useSyncExternalStore`: `subscribe` and `getSnapshot`. The profile is read from the
 * phone on the first subscription.
 */
export type ProfileRepository = {
  subscribe(onChange: () => void): () => void;
  getSnapshot(): ProfileSnapshot;
  /** Validates (like `bookingRepository` re-checks a booking), trims and saves. */
  save(profile: UserProfile): Promise<UserProfile>;
};

type Dependencies = {
  store: { read(): Promise<UserProfile | null>; write(profile: UserProfile): Promise<void> };
};

const LOADING: ProfileSnapshot = { status: 'loading' };

/** A repository over the given store. The app uses the shared instance below. */
export function createProfileRepository({ store }: Dependencies): ProfileRepository {
  let snapshot: ProfileSnapshot = LOADING;
  let started = false;
  const listeners = new Set<() => void>();

  const set = (next: ProfileSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const load = () => {
    if (started) return;
    started = true;
    store.read().then(
      (profile) => {
        // A save that finished first already holds the newer profile.
        if (snapshot.status === 'loading') set({ status: 'ready', profile });
      },
      () => {
        if (snapshot.status === 'loading') set({ status: 'ready', profile: null });
      }
    );
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      load();
      return () => {
        listeners.delete(onChange);
      };
    },

    getSnapshot() {
      return snapshot;
    },

    async save(input) {
      const errors = validateRenter({ renterName: input.name, renterEmail: input.email });
      if (Object.keys(errors).length > 0) {
        throw new InvalidProfileError(errors);
      }
      const location = input.preferredLocation?.trim();
      const profile: UserProfile = {
        name: input.name.trim(),
        email: input.email.trim(),
        ...(location ? { preferredLocation: location } : {}),
      };
      // Saved first: the screen shows it as saved only once it really is on the phone.
      await store.write(profile);
      set({ status: 'ready', profile });
      return profile;
    },
  };
}

export const profileRepository: ProfileRepository = createProfileRepository({
  store: profileStore,
});
