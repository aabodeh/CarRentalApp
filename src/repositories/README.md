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
