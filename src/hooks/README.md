# hooks

Custom React hooks (`useX`) that connect the UI to repositories and context.

**Goes here now:**

- `useTheme`: the colour tokens for the current light/dark scheme.
- `useReducedMotion`: true when the OS asks for reduced motion. Every animation must honour it.
- `useCars`: the car list as `loading | error | empty | ready`, plus `refresh`/`isRefreshing`.
  `ready` and `empty` carry `fetchedAt` and `freshness`. It refreshes by itself when the
  connection comes back.
- `useEntrance(index)`: the staggered fade-and-rise for list cards and details sections. It is
  gated on reduce motion.
- `useCar(id)`: one car as `loading | not-found | error | ready`, read from the same cached list
  as `useCars`, so details and list always agree. `not-found` is separate from
  `error` because retrying can't make a missing car appear.

- `useNetworkStatus`: `{ isOffline }` from expo-network's OS events. An unknown state counts as
  online.
- `useMyBookings()`: the user's bookings, newest first, with car names from the cached list, as
  `loading | error | empty | ready`.
- `useNow(ms)`: the current time, ticking, for "Updated 5 minutes ago".

**Goes here later:** `useSyncStatus` — hooks that own
loading/error/data state and call a repository.

**Does not go here:** raw network or storage calls. A hook calls a repository;
the repository decides where the data actually comes from.

This is the layer that makes K3 (sync status always visible) cheap: a hook
exposes `status: 'pending' | 'failed' | 'completed'` and any screen can show it.
