# Requirements → evidence

One row per requirement from the project case, and one per kernel NFR. A requirement only counts
as covered when there is a file that implements it **and** a test that proves it.

**This document is checked by a test.** `__tests__/docs/requirementsCoverage.test.ts` fails if
any file path cited here does not exist, or if any test cited under "Evidence" is not in the test
file it names. If you rename a test or move a file, update this page.

How to read "proved by a test": the tests run in Jest with the network mocked (`fetch` is stubbed;
no test touches the real API). What only a real device or the real API can show is listed under
[Not proved by automated tests](#not-proved-by-automated-tests).

## Summary

| #   | Requirement                                  | Implemented in                                                         | Proved by                                             | Deferred                                                   |
| --- | -------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| F1  | View a list of cars                          | `CarListScreen`, `CarCard`, `useCars`                                  | 4 screen tests ([F1](#f1--view-a-list-of-cars))       | Search, filter and sort                                    |
| F2  | View the details of a car                    | `CarDetailsScreen`, `CarDetails`, `useCar`                             | 4 screen tests ([F2](#f2--view-the-details-of-a-car)) | Image gallery; availability by date                        |
| F3  | Place a booking                              | `BookingScreen`, `BookingForm`, `validateBooking`, `bookingRepository` | 8 tests ([F3](#f3--place-a-booking))                  | Editing or cancelling a booking; accounts; payment         |
| F4  | Use an API                                   | `src/services/api/` against a MockAPI project                          | 8 tests ([F4](#f4--use-an-api))                       | A backend of our own; authentication                       |
| F5  | Persist API data                             | `src/storage/`, written by `carRepository`                             | 6 tests ([F5](#f5--persist-api-data))                 | SQLite; cache expiry or size limits                        |
| K1  | Offline availability of data already fetched | `carRepository` (cache, then refresh), `OfflineBanner`, `DataAge`      | 9 tests ([K1](#k1--offline-availability))             | Offline image caching beyond what `expo-image` does itself |
| K2  | Failed writes are queued and retried         | `syncPolicy`, `syncQueue`, `bookingRepository`, `BookingContext`       | 11 tests ([K2](#k2--queued-writes-with-retry))        | Retries while the app is closed; conflicts; multi-device   |
| K3  | Sync status is always visible                | `SyncStatusBadge`, `BookingRow`, `SyncToast`, tab badge                | 8 tests ([K3](#k3--visible-sync-status))              | Push notifications                                         |

---

## F1 — View a list of cars

**Implemented in**

- `src/screens/CarListScreen.tsx`: a `FlatList` of cars, with loading, error, empty and ready
  states.
- `src/components/CarCard.tsx`, `src/components/CarListHeader.tsx`, `src/components/Skeleton.tsx`
- `src/hooks/useCars.ts`: the list as a `loading | error | empty | ready` union.
- `src/navigation/RootNavigator.tsx`, `src/navigation/CarsNavigator.tsx`: the list is the first
  screen.

**Evidence**

- `__tests__/screens/CarListScreen.test.tsx` › shows every car once they have loaded
- `__tests__/screens/CarListScreen.test.tsx` › shows loading skeletons while the cars are being fetched
- `__tests__/screens/CarListScreen.test.tsx` › shows an error and recovers when the user taps retry
- `__tests__/screens/CarListScreen.test.tsx` › shows the empty state when there are no cars

**Deferred:** search, filtering and sorting.

## F2 — View the details of a car

**Implemented in**

- `src/screens/CarDetailsScreen.tsx`: reads the `carId` route param.
- `src/components/CarDetails.tsx`, `src/components/CarHero.tsx`, `src/components/SpecGrid.tsx`,
  `src/components/CarStateView.tsx`
- `src/hooks/useCar.ts`: `loading | not-found | error | ready`.

**Evidence**

- `__tests__/screens/CarListScreen.test.tsx` › opens the details of the tapped car
- `__tests__/screens/CarDetailsScreen.test.tsx` › shows the car's name, price and specs
- `__tests__/screens/CarDetailsScreen.test.tsx` › shows a not-found message with a way back when the car does not exist
- `__tests__/screens/CarDetailsScreen.test.tsx` › shows an error with retry when loading fails

**Deferred:** more than one photo per car. Availability is a static flag on the car, not
calculated from dates.

## F3 — Place a booking

**Implemented in**

- `src/screens/BookingScreen.tsx`, `src/components/BookingForm.tsx`,
  `src/components/DateField.tsx`, `src/components/TextField.tsx`,
  `src/components/BookingSummary.tsx`
- `src/utils/validateBooking.ts`: name, email, no past dates, end not before start.
- `src/utils/daysBetween.ts`, `src/utils/calculateTotalPrice.ts`: a same-day rental counts as one
  day.
- `src/repositories/bookingRepository.ts`: `createBooking` re-validates, prices the booking from
  the car's rate and saves it on the phone.
- `src/context/BookingContext.tsx`: `createBooking`, with the double-submit guard.

**Evidence**

- `__tests__/screens/CarDetailsScreen.test.tsx` › opens the booking form for this car
- `__tests__/screens/CarDetailsScreen.test.tsx` › disables booking and says why when the car is unavailable
- `__tests__/screens/BookingScreen.test.tsx` › rejects a blank name
- `__tests__/screens/BookingScreen.test.tsx` › rejects a malformed email
- `__tests__/screens/BookingScreen.test.tsx` › rejects an end date before the start date
- `__tests__/screens/BookingScreen.test.tsx` › updates the day count and total when the dates change
- `__tests__/screens/BookingScreen.test.tsx` › saves the booking as pending and opens My bookings, where its status is shown
- `__tests__/screens/BookingScreen.test.tsx` › creates only one booking when submit is pressed twice

**Deferred:** editing or cancelling a booking, user accounts (the renter is a name and an email),
payment.

## F4 — Use an API

**Implemented in**

- `src/services/api/client.ts`: `fetch` with an 8-second timeout and typed errors.
- `src/services/api/carApi.ts`: `GET /cars`.
- `src/services/api/bookingApi.ts`: `POST /bookings`, and the lookup by `clientBookingId`.
- `src/services/api/config.ts`: the base URL, read from `app.json`.
- `src/types/guards.ts`: every reply is validated before it becomes a `Car`.
- `docs/api/README.md`: the MockAPI project, its resources and what was observed about it.

**Evidence**

- `__tests__/services/api/client.test.ts` › returns validated cars from GET /cars
- `__tests__/services/api/client.test.ts` › throws ApiTimeoutError when the server takes longer than the timeout
- `__tests__/services/api/client.test.ts` › throws ApiStatusError with the status on a 500
- `__tests__/services/api/client.test.ts` › throws ApiPayloadError when a car is missing a field
- `__tests__/services/api/client.test.ts` › throws ApiNetworkError when the request never reaches the server
- `__tests__/services/api/bookingApi.test.ts` › POSTs the booking with our local id as clientBookingId, and returns the server id
- `__tests__/services/api/bookingApi.test.ts` › finds a booking the server already has, by exact client id
- `__tests__/data/dummy/seed.test.ts` › passes the same guard the app applies to API replies

**Deferred:** a backend of our own, and authentication. MockAPI has neither unique keys nor auth.

## F5 — Persist API data

**Implemented in**

- `src/storage/keyValueStore.ts`: AsyncStorage, keys `carrental.v2.<name>`, values
  `{ version, savedAt, data }`.
- `src/storage/carCache.ts`: the last car list fetched from the API, with its fetch time.
- `src/repositories/carRepository.ts`: writes the cache after every successful fetch.
- `src/storage/bookingStore.ts`: bookings, which also survive a restart.

**Evidence**

- `__tests__/storage/keyValueStore.test.ts` › reads back exactly what it wrote, with the time it was saved
- `__tests__/storage/keyValueStore.test.ts` › stores the cars with the time they were fetched
- `__tests__/repositories/carRepository.test.ts` › refreshes in the background and replaces the cached cars with fresh ones
- `__tests__/storage/keyValueStore.test.ts` › treats corrupt JSON as nothing stored, and removes it, instead of crashing
- `__tests__/storage/keyValueStore.test.ts` › discards data written by a different storage version
- `__tests__/storage/bookingStore.test.ts` › keeps a booking and its place in the retry queue across a restart

**Deferred:** SQLite (AsyncStorage is enough for one list and a handful of bookings), cache expiry
and size limits.

## K1 — Offline availability

> Data that has already been fetched stays readable with no network.

**Implemented in**

- `src/repositories/carRepository.ts`: cache, then refresh. The saved copy is served at once,
  and if the API fails it keeps being served, marked `stale`.
- `src/hooks/useCars.ts`, `src/hooks/useCar.ts`: both read the same cached list, so details work
  offline for any car already seen. `useCars` refreshes when the connection returns.
- `src/hooks/useNetworkStatus.ts`, `src/components/OfflineBanner.tsx`,
  `src/components/DataAge.tsx`

**Evidence**

- `__tests__/repositories/carRepository.test.ts` › serves cached cars instantly, before the network answers
- `__tests__/repositories/carRepository.test.ts` › keeps serving the cache, marked stale, when the API fails
- `__tests__/repositories/carRepository.test.ts` › reports an error when the API fails and there is no cache
- `__tests__/repositories/carRepository.test.ts` › answers from the cache without the network, so booking works offline
- `__tests__/screens/CarListScreen.test.tsx` › shows the offline banner, and still shows the saved cars, when offline
- `__tests__/screens/CarListScreen.test.tsx` › marks the list as a saved copy when it could not be refreshed
- `__tests__/screens/CarDetailsScreen.test.tsx` › opens a car that was already seen while offline, with the offline banner
- `__tests__/hooks/useCars.test.ts` › refreshes by itself when the connection comes back
- `__tests__/components/OfflineBanner.test.tsx` › says what still works when offline

**Deferred:** car photos offline rely on `expo-image`'s own disk cache; we do not manage or test
it.

## K2 — Queued writes with retry

> A write that fails is queued and retried with backoff, never silently dropped.

**Implemented in**

- `src/repositories/syncPolicy.ts`: the rules. 2 s, 8 s, 30 s; four attempts; then the user
  retries by hand.
- `src/repositories/syncQueue.ts`: the queue, derived from the stored bookings.
- `src/repositories/bookingRepository.ts`: `syncBooking`, one attempt, with the idempotency
  check before a retry.
- `src/storage/bookingStore.ts`: each booking is stored with its retry bookkeeping.
- `src/context/BookingContext.tsx`: runs the queue at start, on foreground and on reconnect.

**Evidence**

- `__tests__/repositories/syncQueue.test.ts` › retries a failed booking by itself after the backoff delay
- `__tests__/repositories/syncQueue.test.ts` › waits 2 s, then 8 s, then 30 s between attempts
- `__tests__/repositories/syncQueue.test.ts` › stops after four attempts and waits for the user to retry by hand
- `__tests__/repositories/syncQueue.test.ts` › does not use up attempts while offline, and sends when the connection returns
- `__tests__/repositories/syncQueue.test.ts` › does not create a duplicate when a retry finds the booking already on the server
- `__tests__/repositories/syncQueue.test.ts` › sends a booking left pending by a previous session
- `__tests__/repositories/syncQueue.test.ts` › never sends the same booking twice at the same time
- `__tests__/context/BookingContext.test.tsx` › keeps a booking made offline pending, and sends it when the connection returns
- `__tests__/context/BookingContext.test.tsx` › tries again when the app comes back to the foreground
- `__tests__/context/BookingContext.test.tsx` › sends bookings left unsent by a previous session as soon as it starts
- `__tests__/screens/BookingScreen.test.tsx` › saves a booking made offline as pending, without trying to send it

**Deferred:** retries while the app is closed (would need OS background tasks), conflict
resolution, and multi-device sync: two devices retrying the same booking at the same moment could
still create it twice.

## K3 — Visible sync status

> The user can always see whether their data is `pending`, `failed` or `completed`.

**Implemented in**

- `src/components/SyncStatusBadge.tsx`: the status in words plus a colour dot.
- `src/components/BookingRow.tsx`: each booking with its badge and a sentence saying what happens
  next, plus "Try again".
- `src/screens/MyBookingsScreen.tsx`, `src/hooks/useMyBookings.ts`
- `src/components/SyncToast.tsx`: shown and announced when a booking succeeds after a failure.
- `src/navigation/RootNavigator.tsx`: a badge on the My bookings tab counts unsent bookings.

**Evidence**

- `__tests__/components/SyncStatusBadge.test.tsx` › announces the new status when it changes
- `__tests__/screens/MyBookingsScreen.test.tsx` › lists bookings newest first, each with its car, dates, total and sync status
- `__tests__/screens/MyBookingsScreen.test.tsx` › offers "Try again" on a booking that could not be sent, and sends it
- `__tests__/screens/MyBookingsScreen.test.tsx` › keeps the bookings on screen while offline and says they will sync
- `__tests__/components/SyncToast.test.tsx` › tells the user, and announces it, when a booking that had failed is confirmed
- `__tests__/components/SyncToast.test.tsx` › shows nothing when a booking is confirmed at the first attempt
- `__tests__/navigation/RootNavigator.test.tsx` › shows how many bookings could not be sent on the My bookings tab
- `__tests__/context/BookingContext.test.tsx` › retries by itself after a failure, and tells the user once it succeeds

**Deferred:** push notifications. The notice is in-app only, so it is seen when the app is open.

---

## Not proved by automated tests

These need a device, or the real API, and are in the device scripts of the pull requests:

- **The live API.** Tests stub `fetch`. The real MockAPI project was exercised by hand: its `/cars`
  reply was run through the app's guard, and two probe bookings were posted and deleted to observe
  how it behaves (`docs/api/README.md`).
- **Real network changes.** Airplane mode, reconnecting, and the app returning to the foreground
  are simulated in tests by switching a mocked network status and an `AppState` event.
- **Real time.** The 2 s / 8 s / 30 s backoff runs on fake timers.
- **How it looks and feels.** Animation, haptics, the native date pickers, the keyboard covering
  or not covering the submit button, 200 % text size, and VoiceOver/TalkBack actually reading the
  labels and announcements.
