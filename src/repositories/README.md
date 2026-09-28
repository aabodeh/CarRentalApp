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

- `carRepository.ts`: `getCars()` and `getCarById(id)`, backed by `src/data/dummy/`. It answers
  after `SIMULATED_LATENCY_MS` (400 ms, **temporary**) so the UI has real loading states now.
  `getCarById` throws `CarNotFoundError` for an unknown id. The `CarRepository` type is the contract
  the API-backed version will implement.

- `bookingRepository.ts`: `createBooking(input)` re-validates the input (`validateBooking`),
  prices the booking from the car's rate (never from the form) and saves it with
  `syncStatus: 'pending'`. `syncBooking(id)` settles it to `'completed'`. **This is the K3 seam:** the
  next PR replaces `syncBooking`'s internals with the API call and the retry queue (K2), and nothing
  above it changes. `createInMemoryBookingRepository()` gives tests a fresh store.
- `simulatedLatency.ts`: the shared temporary delay.

In tests, stub a repository method with `jest.spyOn(carRepository, 'getCars')` instead of mocking
the whole module.
