# context

React Context providers for state that genuinely spans screens — the current
booking draft, and later the app-wide sync status (K3).

**Goes here:** provider + a `useX` consumer hook that throws a clear error when
used outside its provider.

**Does not go here:** data fetching. A provider calls a hook, which calls a
repository. Context is for sharing state, not for getting it.

Prefer local `useState` first. Only promote state to context when a second
screen actually needs it.

## Today

- `BookingContext.tsx`: `BookingProvider` (mounted in `App.tsx`) and `useBookings()`, which gives
  `{ bookings, creation, createBooking }`.
  - The state transitions are a pure `bookingReducer`, unit-tested without rendering.
  - `createBooking` saves a pending booking through `bookingRepository`, then syncs it in the
    background. A booking whose sync fails is marked `failed`, not dropped.
  - A second `createBooking` while one is in flight returns the same promise. The guard is a ref,
    not state, because two taps in the same frame both still see `idle` in state.
  - The provider takes an optional `repository` prop for tests.
