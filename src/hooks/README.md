# hooks

Custom React hooks (`useX`) that connect the UI to repositories and context.

**Goes here:** `useCars`, `useBooking`, `useSyncStatus` — hooks that own
loading/error/data state and call a repository.

**Does not go here:** raw network or storage calls. A hook calls a repository;
the repository decides where the data actually comes from.

This is the layer that makes K3 (sync status always visible) cheap: a hook
exposes `status: 'pending' | 'failed' | 'completed'` and any screen can show it.
