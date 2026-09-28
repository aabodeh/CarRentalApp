# hooks

Custom React hooks (`useX`) that connect the UI to repositories and context.

**Goes here now:**

- `useTheme`: the colour tokens for the current light/dark scheme.
- `useReducedMotion`: true when the OS asks for reduced motion. Every animation must honour it.
- `useCars`: the car list as `loading | error | empty | ready`, plus `refresh`/`isRefreshing`.
- `useCar(id)`: one car as `loading | not-found | error | ready`. `not-found` is separate from
  `error` because retrying can't make a missing car appear.

**Goes here later:** `useBooking`, `useSyncStatus` — hooks that own
loading/error/data state and call a repository.

**Does not go here:** raw network or storage calls. A hook calls a repository;
the repository decides where the data actually comes from.

This is the layer that makes K3 (sync status always visible) cheap: a hook
exposes `status: 'pending' | 'failed' | 'completed'` and any screen can show it.
