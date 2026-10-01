# utils

Small, pure, framework-free helpers. No React, no I/O, and trivial to unit test.

- `parseIsoDate`: strict `YYYY-MM-DD` → Date at midnight UTC. Rejects impossible dates.
- `daysBetween`: rental days as 24-hour periods (1 → 3 Oct is 2 days). A same-day rental counts
  as 1 day.
- `calculateTotalPrice`: day rate × `daysBetween`.
- `formatPrice`: DKK in `da-DK` format (`1.195 kr.`), with a non-breaking space.
- `formatDateRange`: `1.–3. okt. 2026`, collapsing whatever the two dates share.

- `localDate`: the user's wall-clock side of dates. `todayIsoDate()`, `addDays`, and conversions
  to and from the native picker's local `Date`.
- `validateBooking`: every booking-form problem at once, with `today` injected. It has two
  callers, the form and `bookingRepository`.
- `validateRenter`: the name and email rules, shared by `validateBooking` and the profile form, and
  `fieldsNeedAttention` for the announcement.
- `filterCars`: search plus chip groups. OR within a group, AND across groups.
- `nextBooking`: the soonest booking that starts today or later.
- `carLabels`: display words for transmission and fuel, and the "not available" copy.
- `formatRelativeTime`: "just now", "5 minutes ago", "yesterday".
- `toError`: normalises anything thrown into an `Error`.

The date helpers **throw a `RangeError`** on malformed dates or a range that ends before it starts.
The UI validates input first; these functions are the last line of defence, not the validator.

**Does not go here:** anything that needs state, navigation or the network. If a helper is only used
by one module, leave it in that module until a second caller appears.
