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
