# Booking details with code and QR — design

Date: 2026-10-02 · Status: draft, awaiting review · Part 1 of 3

## Context

The request: every booking gets a code and a QR, and My bookings lets the user open a booking to
see them. Modifying and cancelling were also requested, and are split off as parts 2 and 3. They
are on AGENTS.md's "Deferred, on purpose" list and change the K2 retry rules, so un-deferring them
is a team decision. This document covers part 1 only.

### What was asked

- Each booking has a code and a QR.
- From My bookings the user can open a booking and see them.

### Assumptions (confirmed during brainstorming)

- The QR is a pick-up pass shown at the counter. Nothing in scope scans it; it carries the same
  identifier as the code.
- The details screen works offline (K1). The bookings already live on the phone.
- **Code and QR appear only once the booking is `completed`.** Until then the screen says the
  booking is not confirmed yet. A pass for a booking the server does not have would promise
  something untrue.

### Success criteria

Tapping a booking in My bookings opens its details: car, dates, total, renter, sync status (K3),
and, once confirmed, the code and the QR. Everything works offline and at 200% text size.

## Decision: where the code comes from

The code is derived from the booking's existing local id, which is already sent to the server as
`clientBookingId` and used there for the K2 duplicate check. So the code names something the
server can look up.

Rejected:

- **The server's (MockAPI) id.** MockAPI numbers bookings `1`, `2`, `3`, which is not usable as a
  code. Storing it means changing the stored shape, bumping `STORAGE_VERSION` and migrating
  existing `completed` bookings. Part 2 (cancel) will need it for `DELETE`, so it is deferred to
  there.
- **A new random `bookingCode` field.** It changes `Booking`, the class diagram, the guard and
  `STORAGE_VERSION`. Under the "corrupt or outdated reads as nothing stored" rule, a version bump
  without a migration would wipe users' saved bookings.

Consequence: no change to `Booking`, the class diagram, `STORAGE_VERSION`, the repositories or the
retry queue.

## Design

### Navigation

- New `src/navigation/MyBookingsNavigator.tsx`: a native stack `MyBookingsList` →
  `BookingDetails { bookingId: string }`, mirroring `CarsNavigator`.
- `navigation/types.ts`: `MyBookingsStackParamList`. `MyBookingsTab` becomes
  `NavigatorScreenParams<MyBookingsStackParamList>`, plus a `MyBookingsStackScreenProps<T>` helper.
- Only the id is passed, not the booking. The details screen reads the booking from
  `BookingContext`, so a status change while the screen is open (`pending` → `completed`) shows
  the pass without navigating away.
- `BookingScreen` keeps `navigation.navigate('MyBookingsTab')`. With nested params optional this
  still opens the list; its existing tests (`BookingScreen.test.tsx:174`, `:213`) verify it.

### My bookings row (`BookingRow`)

- The card's content (car, dates, total, status, explanation) is wrapped in a `Pressable` with role
  `button` and the hint "Shows the booking's code and details". Press feedback follows the
  existing pattern, honours reduce motion and uses theme durations.
- **Try again stays outside the pressable area**, below it in the same card. A button nested inside
  a button is unreachable for VoiceOver.
- `MyBookingsScreen` passes an `onOpen(bookingId)` that navigates to `BookingDetails`.
- **Risk, flagged per FL-020:** `MyBookingsScreen.test.tsx:104` pins the row titles as the screen's
  only headers. If wrapping the content in an accessible `Pressable` changes what that query finds,
  the test is **not** edited quietly; the team decides.
- `MyBookingsScreen.test.tsx` types its props as `RootTabScreenProps<'MyBookingsTab'>`. That type
  becomes the stack's. This is a typing change forced by the navigator, not a behaviour change, and
  will be called out in the PR.

### Details screen (`src/screens/BookingDetailsScreen.tsx`)

State comes from a new hook, `src/hooks/useBookingDetails.ts`, as a union:

```ts
| { status: 'loading' }
| { status: 'error'; error: Error; retry: () => void }
| { status: 'not-found' }
| { status: 'ready'; record: StoredBooking; carName: string }
```

`carName` is resolved the same way `useMyBookings` does it, from the cached car list, falling back
to `Car <id>`. The shared lookup is extracted into one helper rather than duplicated. A load error
in `BookingContext` maps to the same error state My bookings shows.

Layout, top to bottom (extract components if the screen passes ~150 lines):

1. Car name (header), dates, total price, renter name and email.
2. `SyncStatusBadge`, the same "what happens next" sentence as the row (`syncExplanation`), and
   **Try again** when `needsManualRetry`.
3. The pass (`BookingPass` component):
   - `completed`: the code, large, then the QR.
   - otherwise: "Not confirmed yet. Your booking code and QR appear here once our server has
     confirmed it." It does not promise retries; the status sentence above covers what happens
     next.

`not-found`: a `StateView` saying the booking is no longer on this phone, with a way back to
My bookings.

### The code (`src/utils/formatBookingCode.ts`)

- A pure function: `booking-mg8xk2lq-1` → `MG8XK2LQ-1` (drop the `booking-` prefix, upper-case).
- An id not in that format falls back to the whole id, upper-cased. It never throws and never
  returns an empty string.
- Shown with a new typography token for the code (large, letter-spaced) in `src/theme/`.
- Its `accessibilityLabel` spells the code character by character, so a screen reader does not
  try to pronounce it as a word.

### The QR (`src/components/BookingQrCode.tsx`)

- Encodes the exact booking id (the server's `clientBookingId`), not the display code.
- Dependencies, both reasons to go in the PR description:
  - `react-native-svg` (15.15.4, the version Expo SDK 57 bundles), installed with
    `npx expo install`. It draws vector shapes, which React Native cannot do on its own. Works in
    Expo Go.
  - `qrcode-generator` (2.0.4, no dependencies of its own), which turns a string into the QR
    module matrix. Chosen over `react-native-qrcode-svg`, which pulls in `qrcode`, `prop-types`
    and an unmaintained `text-encoding` polyfill. Our component draws the matrix as a single SVG
    `<Path>`, in about 30 lines a teammate can explain.
  - Its API is checked against the installed `index.d.ts` before use (FL-011). After installing:
    read the lockfile diff (FL-008), and run `npx expo export` once to read the asset list (FL-004).
- Always dark on light, with a quiet zone, including in dark mode, so it stays scannable. New tokens
  `qr.foreground` and `qr.background`, plus a QR size token, in `src/theme/`. The colour pair gets a
  row in `__tests__/theme/colors.test.ts`.
- Role `image`, label "QR code for booking MG8XK2LQ-1".

### Out of scope

Brightness boost while showing the QR, sharing or saving the QR, Apple/Google Wallet, cancel
(part 2), modify (part 3), storing the server's id (part 2).

## Testing

Test names follow the acceptance criteria. The design document gets the Gherkin scenarios to match.

- `__tests__/utils/formatBookingCode.test.ts`: formats a local id; falls back for an unexpected id;
  never returns an empty string.
- `__tests__/components/BookingQrCode.test.tsx`: renders an image labelled with the booking code.
  Encoding correctness is the library's job. Our test checks that the matrix is drawn: a non-empty
  path.
- `__tests__/hooks/useBookingDetails.test.tsx`: loading; error with retry; ready with the car name; not-found for an
  unknown id; follows a status change in the context.
- `__tests__/screens/BookingDetailsScreen.test.tsx`, wrapped in
  `BookingProvider repository={createInMemoryBookingRepository()}` and following the retry-queue
  timer rules in AGENTS.md (FL-021):
  - `it('shows the booking code and QR once the booking is confirmed')`
  - `it('says the booking is not confirmed yet, without a code or QR, while it is pending')`
  - `it('shows the code and QR when the booking is confirmed while the screen is open')`
  - `it('offers "Try again" on a booking that could not be sent')`
  - `it('says the booking is no longer on this phone when it cannot be found')`
  - `it('shows the booking offline')`
- `__tests__/screens/MyBookingsScreen.test.tsx`, new case:
  `it('opens a booking\'s details when the user taps it')`. All existing cases unchanged in
  behaviour.
- `__tests__/theme/colors.test.ts`: a row for `qr.foreground` on `qr.background`.

## Documentation

- READMEs for `navigation/`, `screens/`, `components/`, `hooks/`, `utils/` and `theme/` (new
  tokens).
- `docs/requirements-coverage.md`: candidate FE/US entry for the design document.
- AGENTS.md: no convention changes expected.
- AI log entry (`A-###`) for this work. Verification and decision fields stay `TODO` for a human.
