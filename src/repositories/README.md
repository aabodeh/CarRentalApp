# repositories

**The seam of the whole app.** A repository is the only thing that knows where
data comes from. Everything above it — screens, components, hooks, context —
asks the repository and does not care whether the answer arrived from dummy
data, the API, or local storage.

**Goes here:** `carRepository.ts`, `bookingRepository.ts`. Each exports plain
async functions (`getCars()`, `getCarById(id)`, `createBooking(booking)`).

**Does not go here:** React. A repository is plain TypeScript, which is what
makes it easy to unit test without rendering anything.

This is where the mandatory NFRs land:

- **K1 — offline availability:** read from `storage/` first, refresh from
  `services/api/` when online, write the fresh copy back to `storage/`.
- **K2 — queued writes:** a failed write goes onto the retry queue in
  `storage/` instead of throwing away the user's input, and is retried with
  backoff.
- **K3 — sync status:** the repository is what knows whether a record is
  pending, failed or completed. It reports that upward; hooks surface it.

Swapping dummy data for the real API should be a change _inside this folder
only_. If a swap forces you to edit a screen, the boundary was drawn wrong.

## Today

- `carRepository.ts`: **cache, then refresh (K1).**
  - `subscribeCars(listener)` delivers the cached list at once (freshness `refreshing`), then
    the API's (`fresh`).
  - If the API fails and a cache exists, the cache is re-sent as `stale`. Only with no cache at
    all is it an error.
  - `refreshCars()` is for pull-to-refresh and retry; concurrent calls share one request.
  - `getCarById(id)` is cache-first, so a car already seen can be booked offline.
- `bookingRepository.ts`:
  - `createBooking` validates, prices from the car's rate (never the form) and saves to
    `storage/` as `pending`. It never needs the network.
  - `syncBooking` POSTs the booking. Accepted → `completed`. Unreachable (offline, timeout, no
    URL) → stays `pending`. Rejected by the server → `failed`.
  - PR 5 adds the retry queue (K2) behind `syncBooking`.

Both are built by factories (`createCarRepository`, `createBookingRepository`) with their
dependencies (API functions, storage) passed in. The app uses one shared instance of each, and
repository tests build their own with fakes. Hook and screen tests use the helpers in
`__tests__/helpers/`.
