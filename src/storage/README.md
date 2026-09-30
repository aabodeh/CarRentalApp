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
- `carCache.ts`: `carrental.v2.cars`, the last fetched car list and its `fetchedAt` (K1).
- `bookingStore.ts`: `carrental.v2.bookings`, every booking made on this phone as
  `{ booking, sync }`. `sync` is the retry bookkeeping (`attempts`, `nextRetryAt`, `rejected`).
  The K2 retry queue is _derived_ from these records; there is no separate queue key.

| Key                     | Holds                                    | Since     |
| ----------------------- | ---------------------------------------- | --------- |
| `carrental.v2.cars`     | `Car[]` + `fetchedAt`                    | PR 4 (v1) |
| `carrental.v2.bookings` | `{ booking: Booking; sync: SyncMeta }[]` | PR 5      |

`STORAGE_VERSION` went from 1 to 2 in PR 5, when the bookings' shape changed. Everything under
`carrental.v1.*` is ignored from then on and left orphaned. The car cache refills itself; v1
bookings only ever existed in development builds. The `sync-queue` key reserved in PR 4 was
dropped in favour of the derived queue.

Tests use the AsyncStorage library's in-memory mock (global, in `jest.setup.js`). Reset it with
`AsyncStorage.clear()`.
