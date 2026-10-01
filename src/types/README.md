# types

Shared domain types: `Car`, `Booking`, `SyncStatus`, and later the DTOs the API returns.

They mirror the class diagram in our design document, so the code and the report agree.
**Change the diagram first, then mirror it here.** Do not invent a field in code.

- `car.ts`: `Car`, `Transmission`, `Fuel`.
- `booking.ts`: `Booking`, `SyncStatus`. The renter is two plain fields (`renterName`,
  `renterEmail`), not an entity, because there is no auth in scope. `syncStatus` is local state that the repository sets
  (K3). The server never sends it.
- Dates are strings: `YYYY-MM-DD` for booking days, full ISO-8601 for `createdAt`. A `Date`
  object does not survive a JSON round-trip through storage or the API.

- `profile.ts`: `UserProfile` (PR 7). It's local to the phone, with no account. Favourites are
  a `string[]` of car ids, not a type: they have nothing of their own to describe.
- `guards.ts`: runtime checks (`isCar`, `isBooking`, `isUserProfile`, `isStringArray`, and array forms) for data from outside
  TypeScript's reach, i.e. API responses and AsyncStorage. Keep each one field-for-field in step
  with its type.

Import from `src/types`, not from the individual files. Types used by exactly one module stay
next to that module.
