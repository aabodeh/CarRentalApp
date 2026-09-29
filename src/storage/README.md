# storage

Local persistence. The only place in the app allowed to touch AsyncStorage,
SQLite or the filesystem.

**Goes here:** a small typed wrapper (`get`, `set`, `remove`) plus the modules
backing the offline requirements:

- the **cache** of already-fetched data (K1)
- the **write queue** of failed mutations awaiting retry (K2)

**Does not go here:** deciding _when_ to read the cache or _when_ to retry.
That is repository logic. Storage just stores.

Only `src/repositories/` should import from here. ESLint blocks screens and components from
it; hooks and context are kept out by review.

## Today

- `keyValueStore.ts`: the only AsyncStorage importer. Keys are `carrental.v<STORAGE_VERSION>.<name>`,
  and values are stored as `{ version, savedAt, data }`. `readJson(name, guard)` returns `null`
  for a missing key, corrupt JSON, another storage version, or data that fails its guard, and
  removes the bad value. **Stored data can never crash the app.** If you change the shape of
  something stored, bump `STORAGE_VERSION`.
- `carCache.ts`: `carrental.v1.cars`, the last fetched car list and its `fetchedAt` (K1).
- `bookingStore.ts`: `carrental.v1.bookings`, every booking made on this phone, with its sync
  status.

| Key                       | Holds                                                               | Since |
| ------------------------- | ------------------------------------------------------------------- | ----- |
| `carrental.v1.cars`       | `Car[]` + `fetchedAt`                                               | PR 4  |
| `carrental.v1.bookings`   | `Booking[]`                                                         | PR 4  |
| `carrental.v1.sync-queue` | **reserved**: `{ bookingId, attempts, nextAttemptAt, lastError }[]` | PR 5  |

Tests use the AsyncStorage library's in-memory mock (global, in `jest.setup.js`). Reset it with
`AsyncStorage.clear()`.
