# components

Reusable presentational pieces shared by more than one screen — `CarCard`,
`PriceTag`, `SyncStatusBadge`, `EmptyState`.

**Goes here:** anything that renders UI and could be dropped into a second
screen unchanged.

**Does not go here:** whole screens (`src/screens/`), data fetching, or
storage access. Components receive everything they draw through props.

Rules that apply here are enforced by ESLint: no `fetch`, no imports from
`services/`, `storage/` or `data/`. If a component needs data, the screen
above it gets the data from a hook and passes it down.

## Today

- `Screen`: the root of every screen. Safe-area padding on the theme background.
- `CarCard`: a car in the catalogue. It has the staggered entrance, press spring, haptic and
  sentence-style accessibility label, and handles the unavailable state.
- `StateView`: the shared empty / error / not-found presentation, with an optional action.
- `Skeleton`: a card-shaped loading placeholder that pulses, and stays static on reduce motion.
- `CarListHeader`: the car list's editorial title and count.

**Theme-aware styles.** Colours change with light and dark mode, so a component builds its styles
with `const createStyles = (colors: ColorTokens) => StyleSheet.create({...})` at the bottom of the
file, and calls `useMemo(() => createStyles(colors), [colors])`. There are still no inline style
objects.

**Animated values** use Reanimated's `.get()` / `.set()`, not `.value =`. The React Compiler lint
rule (`react-hooks/immutability`) rejects assignment to a hook's return value.
