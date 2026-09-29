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
  `{ records, load, creation, notice, createBooking, retryBooking, reload, dismissNotice }`.
  - `records` are `{ booking, sync }`: each booking with its retry bookkeeping.
  - The provider **runs the K2 retry queue**: at start, when the app returns to the foreground,
    when the network comes back, and on the queue's own backoff timer.
  - `notice` is set when a booking succeeds after a failed attempt, and `SyncToast` shows it (K3).
  - The state transitions are a pure `bookingReducer`, unit-tested without rendering.
  - A second `createBooking` while one is in flight returns the same promise, because a ref guards
    it.
  - The provider takes an optional `repository` prop for tests.
