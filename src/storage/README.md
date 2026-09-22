# storage

Local persistence. The only place in the app allowed to touch AsyncStorage,
SQLite or the filesystem.

**Goes here:** a small typed wrapper (`get`, `set`, `remove`) plus the modules
backing the offline requirements:

- the **cache** of already-fetched data (K1)
- the **write queue** of failed mutations awaiting retry (K2)

**Does not go here:** deciding _when_ to read the cache or _when_ to retry.
That is repository logic. Storage just stores.

Only `src/repositories/` may import from here. ESLint enforces that.
