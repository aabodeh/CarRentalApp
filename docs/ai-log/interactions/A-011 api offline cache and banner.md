---
id: A-011
date: 2026-09-29
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 4 — lint/test tooling, MockAPI client with typed errors and guards, AsyncStorage cache (K1), persisted bookings, offline banner and data age
prompt_or_link: '[[P8]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr:
---

# A-011 — API, offline cache and banner

## Prompt

[[P8]], pasted verbatim into Claude Code. The branch was `feat/api-and-offline`, from `main` after
#4–#6 were merged. The prompt asked for:

- team-decided tooling: fail on inline styles, and fail tests on console output
- a typed client for a hosted MockAPI, with runtime validation
- an AsyncStorage cache with cache-then-refresh semantics (K1)
- persisted bookings
- `useNetworkStatus` and an offline banner
- data-age labels
- offline booking landing as `pending`

It asked to start in plan mode and wait for approval.

## Output summary

**Plan-stage flags**, approved with the plan:

1. **The repository contract had to change.** `Promise<Car[]>` answers once, but cache-then-refresh
   answers twice. The contract became `subscribeCars` / `refreshCars` / cache-first `getCarById`.
   The hooks changed; the screens only gained new fields. This was the AI's own design mistake from
   PR #5, logged as [[FL-013 repository contract not designed for k1]].
2. **Inline-style lint.** `eslint-plugin-react-native` isn't shipped by Expo's config, so ESLint's
   own `no-restricted-syntax` is used with the selector
   `JSXAttribute[name.name=/[sS]tyle$/] ObjectExpression`. It was verified against three planted
   forms.
3. **Console → failing test.** Deviation from the prompt: messages are _recorded_, and the test
   fails in `afterEach`, rather than throwing inside `console.error`, because React calls
   `console.error` from its internals, where a throw gets swallowed. Tests that expect a warning
   opt in with `jest.spyOn(console, …)`. The suite passed 5 of 5 runs.
4. **MockAPI setup is for Moha to do**: the schemas and seed are in `docs/api/`, and the base URL
   goes in `app.json` → `extra.apiBaseUrl`. **The URL has not been provided yet**, so the committed
   value is empty and the app behaves as "offline, no cache" until it's set.
5. **Offline booking semantics.** "Unreachable" (network, timeout, no URL) leaves a booking
   `pending`. A server rejection marks it `failed`. Nothing retries yet; that's PR 5.

**Things the AI decided without being told:**

- `useCars` refreshes by itself when the connection comes back.
- `useCar` reads the same cached list as the list screen, instead of fetching `/cars/:id`.
- Bookings POST `clientBookingId`, for PR 5 idempotency.
- The key `carrental.v1.sync-queue` is reserved for PR 5, with its shape documented.
- The seed leaves out `id`.
- `null` network state counts as online.
- The banner announces only when the connection drops while a screen is open, not on every
  screen mount.
- The banner copy, and the data-age wording "Saved copy · updated …".

**Files.**

- **Tooling:**
  - `eslint.config.js`: the inline-style rule
  - `jest.setup.js`: the console guard, plus the AsyncStorage library mock and an expo-network
    mock. Both mocks were added only after the suite showed it needed them.
  - `package.json`: `testPathIgnorePatterns` for `__tests__/helpers/`
- **Dependencies:** AsyncStorage 2.2.0 and expo-network 57.0.2, plus `expo-constants` declared.
  All were installed with `expo install`, and the lockfile shows only those packages and
  AsyncStorage's two helpers.
- **`src/types/guards.ts`**: `isCar` and `isBooking`, and their array forms.
- **`src/services/api/`**:
  - `config.ts` (the base URL from `extra`)
  - `client.ts` (8 s timeout; `ApiConfigError` / `Network` / `Timeout` / `Status` / `Payload`
    errors; `isUnreachable`)
  - `carApi.ts`, `bookingApi.ts`
- **`src/storage/`**: `keyValueStore.ts` (versioned envelope, defensive reads), `carCache.ts` and
  `bookingStore.ts`.
- **`src/repositories/`**: `carRepository` (cache-then-refresh) and `bookingRepository` (persisted,
  real POST), both built by factories. `simulatedLatency.ts` was deleted.
- **Hooks:** `useCars` and `useCar` (subscriptions), `useNetworkStatus`, `useNow`.
  **Context:** `BookingContext` loads saved bookings.
- **Components:** `OfflineBanner` (inside `Screen` and `CarDetails`) and `DataAge`.
  `CarListHeader`, `CarDetails` and `BookingConfirmation` consume the new fields and copy.
- **Utils:** `formatRelativeTime`.
- **Docs:** `docs/api/` (resource schemas, a README and `cars.seed.json` generated from the dummy
  cars, with a drift test). READMEs for data/dummy, repositories, storage, services/api, hooks,
  components, utils and types. AGENTS.md: the NFR location table, the cache-then-refresh rule,
  the storage key convention, "API replies are untrusted", the console opt-in and two lessons.
- **Tests:** 38 suites, 299 tests (up from 208). This includes client tests (success, timeout,
  500, malformed, network, missing URL), repository tests (cache hit, background refresh, stale,
  error without cache, one shared request, a cache-write failure), storage tests (round-trip,
  corrupt JSON, version mismatch, guard failure), and screen tests (banner, data age, stale label,
  offline booking pending).

**Problems during the session, as a factual record:**

- [[FL-013 repository contract not designed for k1]]: PR #5's contract couldn't carry K1.
- [[FL-014 invented support path in copy]]: "Please contact us", for a contact channel that
  doesn't exist.
- **A mutation check that didn't mutate.** Testing the seed drift test, the AI edited the seed with
  `sed '0,/re/…'`, which BSD sed on macOS doesn't support. The file was unchanged and the test
  "passed". The AI had printed a count of the edited lines (0), noticed it, and redid the edit with
  Python. The drift test then failed as it should.
- **An inaccurate commit message, corrected before push.** The repositories commit first said only
  the booking-screen offline test depended on the next commit; in fact all the new offline-surface
  screen tests did. It was amended, and now says the commit isn't green on its own. That amend
  changed the commit hash, and FL-013 at first cited the old one. FL-014 at first cited a hash the
  AI had not looked up. Both were checked with `git cat-file` and fixed before commit.
- **A test-mock leak.** React Native's Jest preset already mocks `announceForAccessibility`, and
  `jest.spyOn` on it returns that same shared mock, so calls carried over between `OfflineBanner`
  tests. The test failed; running it alone proved the leak; it's fixed with `jest.clearAllMocks()`.
- **Library behaviour in Jest, not AI errors.** expo-network's `useNetworkState` crashes on unmount
  under jest-expo (its mock has no `remove()`), and AsyncStorage's native module is missing. Both
  were caught by the console guard and failing suites, and both are mocked globally with comments
  explaining why.
- The guards were written alongside their tests, not strictly test-first.

**Verification the AI ran (AI verification, not human):**

- `npm run check` **5 of 5** times: lint with 0 warnings, prettier, `tsc`, and 299/299 tests with
  zero console output.
- `expo-doctor` passed 21/21.
- `npx expo start` served the iOS and Android bundles with HTTP 200 and no warnings.
- `expo export`: 3 font files, a 3.1 MB bundle.
- Mutation checks on the inline-style rule (three forms), the console guard (a planted warning,
  and an opt-in) and the seed drift test.

**Not verified by anyone yet:** the real API. **There is no MockAPI URL yet**, so no request has
ever reached a server. That covers the whole device checklist in the PR, including airplane-mode
behaviour, the banner's feel, data-age labels over time, booking offline and then reconnecting,
and relaunching with a cache.

## Evaluation

TODO (Moha): a human evaluation, after setting the MockAPI URL and running the airplane-mode
script. In particular: is the cache-then-refresh behaviour right on a device, and is the banner
quiet enough?

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. MockAPI vs JSON Server vs Firebase,
AsyncStorage vs SQLite for the cache, schema libraries like zod vs hand-written guards), and
whether it agreed with the AI.
