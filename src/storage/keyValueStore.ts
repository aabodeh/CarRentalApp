import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The only module that touches AsyncStorage.
 *
 * Every value is stored as JSON in an envelope `{ version, savedAt, data }` under a namespaced,
 * versioned key: `carrental.v<STORAGE_VERSION>.<name>`. Reading is defensive: data that is corrupt, from another
 * storage version, or no longer the right shape is removed and reads as "nothing stored". Stored
 * data must never be able to crash the app.
 *
 * Changing the shape of something stored means bumping STORAGE_VERSION: old data is then
 * discarded instead of being misread.
 */
export const STORAGE_NAMESPACE = 'carrental';
/**
 * v1 (PR 4): bookings stored as `Booking[]`.
 * v2 (PR 5): bookings stored as `{ booking, sync }[]`, carrying retry metadata (K2).
 * Bumping this discards everything stored under the old version: the car cache refills itself;
 * v1 bookings existed only in development builds.
 */
export const STORAGE_VERSION = 2;

export const storageKey = (name: string) => `${STORAGE_NAMESPACE}.v${STORAGE_VERSION}.${name}`;

type Envelope = { version: number; savedAt: string; data: unknown };

const isEnvelope = (value: unknown): value is Envelope =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Envelope).version === 'number' &&
  typeof (value as Envelope).savedAt === 'string' &&
  'data' in value;

export type Stored<T> = { data: T; savedAt: string };

/** Reads and validates a value. Anything unusable reads as `null`, and is removed if present. */
export async function readJson<T>(
  name: string,
  guard: (value: unknown) => value is T
): Promise<Stored<T> | null> {
  const key = storageKey(name);

  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await removeQuietly(key);
    return null;
  }

  if (!isEnvelope(parsed) || parsed.version !== STORAGE_VERSION || !guard(parsed.data)) {
    await removeQuietly(key);
    return null;
  }
  return { data: parsed.data, savedAt: parsed.savedAt };
}

/** Writes a value with the time it was saved. A failed write throws; the caller decides. */
export async function writeJson<T>(name: string, data: T, now: Date = new Date()): Promise<void> {
  const envelope: Envelope = { version: STORAGE_VERSION, savedAt: now.toISOString(), data };
  await AsyncStorage.setItem(storageKey(name), JSON.stringify(envelope));
}

async function removeQuietly(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Nothing useful to do: the next read will try again.
  }
}
