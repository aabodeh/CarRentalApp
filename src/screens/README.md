# screens

One file per screen, registered in `src/navigation/RootNavigator.tsx`.

**Goes here:** layout and user interaction. A screen reads data from a hook or
context, renders it, and handles presses.

**Does not go here:** `fetch`, AsyncStorage, SQLite, or imports from
`services/`, `storage/` or `data/`. ESLint fails the build if you try — see
`eslint.config.js`. Get data through a hook, which goes through a repository.

Keep screens short. When a screen passes ~150 lines, pull a piece of it out
into `src/components/`.
