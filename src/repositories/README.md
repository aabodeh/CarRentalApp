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
- `bookingRepository.ts`: bookings stored as `{ booking, sync }`.
  - `createBooking` validates, prices from the car's rate and saves as `pending`. No network.
  - `syncBooking(id, now)` is **one attempt**. Before a retry it checks the API for the booking by
    `clientBookingId` (idempotency). Accepted → `completed`; transient failure → `failed` with the
    next retry scheduled; refused → `failed`, `rejected`.
  - `resetForManualRetry(id)` is the user's "Try again".
- `syncPolicy.ts`: **the K2 rules, in one place**: delays (2 s / 8 s / 30 s), 4 attempts, what is
  due and what needs a manual retry. It also lists what is deliberately out of scope.
- `favouritesRepository.ts`: the saved car ids, as a set. Local only: nothing to queue, no sync
  status. It reads once on first subscription and tells listeners only about real changes. It
  shows a toggle at once and undoes it if saving fails. Writes wait for the first read, and run
  one at a time.
- `profileRepository.ts`: the `UserProfile`, `loading | ready`. `save` re-checks the name and
  email with `validateRenter`, as `bookingRepository` re-checks a booking.

  Both are shaped for React's `useSyncExternalStore` (`subscribe` + a snapshot getter). The hooks
  need no provider, the same as `useCars`.

- `syncQueue.ts`: the engine. It is derived from the stored bookings on every run, makes one
  attempt at a time, uses one timer, and makes no attempts while offline. `BookingContext` runs it.

All are built by factories (`createCarRepository`, `createBookingRepository`, …) with their
dependencies (API functions, storage) passed in. The app uses one shared instance of each, and
repository tests build their own with fakes. Hook and screen tests use the helpers in
`__tests__/helpers/`.
