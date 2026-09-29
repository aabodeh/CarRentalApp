# Development report — raw notes

Raw material for the 5-page development report. **Facts only, no polish.** Every number here was
read from the repository, `gh`, or a test run. Sources are given in brackets. The numbers are
as of branch `feat/sync-and-bookings` (PR 5), before it was merged.

---

## 1. Project and process at a glance

- A car rental app for Funen/Odense. Expo SDK 57, React Native 0.86, TypeScript (`strict`),
  React Navigation 7 (bottom tabs + native stack), React Context. [package.json]
- Mandatory NFRs: **K1** offline reads, **K2** queued writes with retry, **K3** visible sync
  status. [AGENTS.md]
- Pull requests. Nothing was pushed straight to `main`. [gh pr list; `gh pr view N --json reviews,mergedBy`]

  | PR                 | Merged     | What                                                                 |
  | ------------------ | ---------- | -------------------------------------------------------------------- |
  | #1                 | 2026-09-22 | Project setup: tooling, folder skeleton, AGENTS.md, CI, AI-log vault |
  | #2                 | 2026-09-22 | Expo patch bump, ignore Obsidian state                               |
  | #3                 | 2026-09-22 | AI dossier reordered chronologically and backfilled                  |
  | #4                 | 2026-09-28 | Domain types, design system (tokens), dummy data, utils              |
  | #5                 | 2026-09-28 | Car repository, `useCars`, car list screen, motion, a11y             |
  | #6                 | 2026-09-29 | Car details, booking form, `BookingContext`                          |
  | #7                 | 2026-09-29 | Real API (MockAPI), offline cache (K1), offline banner, data age     |
  | #8                 | 2026-09-29 | Follow-up fix: seed MockAPI with ids, set the API base URL           |
  | PR 5 (this branch) | not merged | Retry queue (K2), My bookings + tabs (K3)                            |

- **Review, as recorded on GitHub:** #3–#8 each have an APPROVED review from a teammate who did not
  author them. **#1 has no recorded review** (merged by a teammate). **#2 has no review and was
  merged by its author.** Both were on 2026-09-22, the setup day. The rule "reviewed by a teammate
  who did not generate the code" was followed from #3 on.

- Size now: 73 source files / 4,569 lines in `src/`; 3,517 lines of tests. [`find` + `wc -l`]
- 22 runtime and 11 dev dependencies. Every addition was justified in its PR description, and
  every lockfile diff was checked after install. [package.json, PR bodies]

## 2. Conventions (where they live and how they are enforced)

`AGENTS.md` is the rulebook for humans and AI agents alike. Each folder under `src/` has a README
saying what belongs there. Where a rule can be checked mechanically, it is:

| Rule                                                         | Enforced by                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Screens/components never `fetch` or touch storage (the seam) | ESLint `no-restricted-globals` + `no-restricted-imports` on `src/screens/**`, `src/components/**`            |
| No `any`                                                     | ESLint `@typescript-eslint/no-explicit-any: error`                                                           |
| No `eslint-disable` in app code                              | `linterOptions.noInlineConfig` on `src/**` (added after FL-005)                                              |
| No warnings                                                  | `expo lint --max-warnings 0` (after FL-005)                                                                  |
| No inline style objects                                      | ESLint `no-restricted-syntax` selector `JSXAttribute[name.name=/[sS]tyle$/] ObjectExpression` (after FL-009) |
| No console warnings/errors in tests                          | `jest.setup.js` records `console.error`/`warn` and fails the test in `afterEach` (after FL-011/012)          |
| Formatting                                                   | Prettier, `format:check` in CI                                                                               |
| Types                                                        | `tsc --noEmit`, `strict: true`                                                                               |
| All of the above                                             | `npm run check` locally, and the same in GitHub Actions on every PR                                          |

Conventions that are not machine-checked, and are kept by review:

- One component per file; `PascalCase.tsx` components, `useX.ts` hooks, `camelCase.ts` otherwise.
- `FlatList` for lists, `Pressable` for touchables, `SafeAreaView` from
  `react-native-safe-area-context`.
- Styles: `StyleSheet.create` at the bottom of the file. Theme-aware components use
  `createStyles(colors)` + `useMemo`.
- Every colour, spacing, radius, font size and duration comes from `src/theme/` tokens.
- Animated values use Reanimated `.get()`/`.set()` (the React Compiler lint rejects `.value =`,
  FL-006).
- Tests live in `__tests__/`, mirroring `src/`, and are **named after acceptance criteria**
  (Gherkin → `it('opens the details screen when the user taps a car')`).
- Definition of Done: check green, tests trace to criteria, READMEs current, AI log entry,
  reviewed by a teammate who did not generate the code, CI green.

## 3. Architecture and the repository seam

```
screens / components      render + handle presses; ESLint forbids fetch/storage here
        │
hooks / context           loading/error/sync state as discriminated unions
        │
repositories              THE SEAM — decides where data comes from
        ├── services/api/   fetch + timeout + typed errors + runtime guards
        └── storage/        AsyncStorage, versioned envelopes, defensive reads
```

- **The seam held for the data source.** Dummy data (#4–#6) was replaced by MockAPI plus a
  cache (#7) without rewriting any screen. The screens only gained fields to consume (data age).
- **The seam's _contract_ did not hold** (FL-013). `CarRepository.getCars(): Promise<Car[]>`
  answers once. K1's cache-then-refresh needs two answers (cached now, fresh later). It was
  replaced by `subscribeCars(listener)` / `refreshCars()`. The hooks and all screen tests were
  rewritten, with the same assertions. See §6.
- Where each NFR lives:
  - **K1**: `carRepository` serves the `storage/carCache` copy at once, refreshes from the API,
    writes back, and marks the copy `stale` if the API fails. `useCars` refreshes by itself on
    reconnect. The UI shows `OfflineBanner` and "Updated 5 minutes ago" / "Saved copy · updated …".
  - **K2**: rules in `repositories/syncPolicy.ts`, engine in `repositories/syncQueue.ts`. The
    queue is **derived** from the stored bookings (`{ booking, sync }`); there is no second list.
    Backoff is 2 s / 8 s / 30 s, 4 attempts, then manual "Try again". No attempts while offline.
    A server rejection (4xx) is not retried automatically. It is triggered at start, on
    foreground, on reconnect and by its timer.
  - **K3**: `syncStatus` is `pending | failed | completed`. `SyncStatusBadge` gives words plus a
    colour dot, and is used everywhere a booking appears. Each booking also has a sentence saying
    what happens next. `SyncToast` shows and announces a success after a failure, and a tab badge
    counts failed bookings.
- Storage: keys `carrental.v2.<name>`, values `{ version, savedAt, data }`. Corrupt JSON, another
  version or a wrong shape reads as "nothing stored" and is removed. `STORAGE_VERSION` went 1 → 2
  in PR 5 when the bookings' shape changed.
- API: MockAPI (no backend of our own). The base URL is in `app.json` `extra`. Every reply goes
  through a hand-written guard (`src/types/guards.ts`) before it becomes a domain object. Typed
  errors separate "retry later" (`ApiNetworkError`, `ApiTimeoutError`, `ApiConfigError`) from
  "the server said no" (`ApiStatusError`, `ApiPayloadError`).

## 4. Design patterns actually used (with where)

| Pattern                                   | Where                                                                                            | Why it was needed                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Repository                                | `src/repositories/*`                                                                             | One place knows the data source; UI is unaware of dummy/API/cache                      |
| Factory + dependency injection            | `createCarRepository`, `createBookingRepository`, `createSyncQueue`                              | Tests build isolated instances with fake API/storage; the app uses one shared instance |
| Observer (subscribe/unsubscribe)          | `carRepository.subscribeCars`                                                                    | Cache-then-refresh delivers more than one answer (K1)                                  |
| Stale-while-revalidate                    | `carRepository` + `carCache`                                                                     | K1: show the saved copy now, refresh in the background                                 |
| Discriminated unions as UI state machines | `CarsState`, `CarState`, `MyBookingsState`, `CreationState`, `LoadState`                         | A screen must handle every state; TypeScript refuses to compile a forgotten one        |
| Reducer + Context provider                | `BookingContext` (`bookingReducer`, pure and unit-tested)                                        | Cross-screen booking state, with transitions testable without rendering                |
| Derived work queue (outbox-like)          | `syncQueue` over `bookingStore`                                                                  | K2 without a second source of truth                                                    |
| Backoff policy as data                    | `RETRY_DELAYS_MS` in `syncPolicy.ts`                                                             | Rules in one documented place                                                          |
| Idempotency key                           | `clientBookingId`; checked before every retry                                                    | A retry whose earlier attempt arrived must not duplicate the booking                   |
| Single-flight / request coalescing        | `refreshCars` (one shared request), `createBooking` (ref guard), `syncQueue` (one run at a time) | No duplicate network calls or double bookings from double taps                         |
| Guard / validation at the boundary        | `src/types/guards.ts` on API replies and on storage reads                                        | Untrusted data never becomes a `Car`/`Booking` unchecked                               |
| Versioned envelope                        | `keyValueStore` (`{ version, savedAt, data }`)                                                   | Old stored shapes are discarded instead of misread                                     |
| Design tokens                             | `src/theme/*`                                                                                    | One source of colours, spacing, type, motion; contrast tested                          |

## 5. Testing approach and numbers

- **Tools:** Jest via `jest-expo`, `@testing-library/react-native`, fake timers. [package.json]
- **Layers:**
  - utils, repositories, storage, the queue and the reducer get plain unit tests, with no
    rendering
  - hooks use `renderHook`
  - screens are tested through the UI (`getByRole`, `getByText`, `getByLabelText`)
  - there's one smoke test of `App`
- **Tests over time** [`npm run check` output recorded in A-008…A-011 and this PR]:

  | After | Test suites | Tests |
  | ----- | ----------- | ----- |
  | #4    | 10          | 90    |
  | #5    | 17          | 133   |
  | #6    | 29          | 208   |
  | #7    | 38          | 299   |
  | #8    | 39          | 300   |
  | PR 5  | 45          | 354   |

- **Coverage now:** statements 96.77 %, branches 89.53 %, functions 96.28 %, lines 97.62 %.
  [`jest --ci --coverage`]
- **Accessibility evidence in tests:**
  - `__tests__/theme/colors.test.ts` computes WCAG contrast for every token pair in both schemes,
    and proves that no single accent can reach 4.5:1 on both paper and ink (the ceiling is
    ≈4.21:1).
  - Every car card has an accessibility-label test.
  - Field errors are folded into accessibility labels and tested.
- **Mocks, added only after a suite failed without them** (the rule from FL-001):
  - the Reanimated/Worklets Jest setup (the suite failed to load)
  - the AsyncStorage library mock ("NativeModule: AsyncStorage is null")
  - an `expo-network` `useNetworkState` mock (the real one crashed on unmount under jest-expo)
  - the safe-area mock, only in tests that render the provider
- **Discipline around flaky tests:**
  - explicit fake-timer advancement, never `runAllTimers` (a skeleton animation loops forever)
  - list tests flush timers inside `act`
  - queue tests flush asynchronously
  - `npm run check` is run 5 times before a PR is opened
- **Mutation checks** (break the code on purpose and confirm a test fails): the unavailable-car
  guard, the double-submit ref, the idempotency check, the inline-style lint rule (3 forms), the
  console guard, the lint rule against `eslint-disable`, and the seed drift test.
- **Not covered by automated tests, which a device has to check:**
  - animation feel
  - haptics
  - real keyboard behaviour
  - 200 % text
  - VoiceOver/TalkBack
  - real airplane-mode transitions
  - the date pickers

## 6. Debugging stories (the facts)

### FL-012: an intermittent `act()` warning

- **Symptom:** a full `npm run check` printed `An update to VirtualizedList inside a test was not
wrapped in act(...)`. The tests still _passed_, so CI was green.
- **Reproduction:** 6 full runs, tagging each warning with its test file. It appeared in 3 of 6
  runs, always from `__tests__/screens/CarListScreen.test.tsx` (written in PR #5, already merged).
- **Cause:** `FlatList` (VirtualizedList) renders more rows on a `setTimeout`. With real timers,
  that timer sometimes fired _after_ a test's last assertion, outside `act`.
- **Fix:** fake timers in those tests, and `act(() => jest.runOnlyPendingTimers())` in
  `afterEach`. Afterwards 8 of 8 full runs printed no console output.
- **Consequences:**
  - the next PR made _any_ console warning fail the test
  - in PR 5 that guard caught the same class of bug again: a retry timer starting an async send
    after `act` ended. The fix there was an async flush.
  - the earlier "no console output" claims were based on lucky runs, and the log says so.

### FL-013: the repository contract that couldn't carry K1

- **What:** PR #5 defined `getCars(): Promise<Car[]>`, with a comment claiming the cache (K1)
  would later fit "behind this same shape". AGENTS.md said to design for K1–K3 from the start.
- **When caught:** while planning PR #7, before any code. Cache-then-refresh means two answers,
  and a promise resolves once.
- **Options at that point:**
  - block on the network (fails K1)
  - drop the refresh (fails "fresh data")
  - change the contract

  The contract was changed.

- **Cost:** `useCars`/`useCar` and every screen test were rewritten. The screens themselves only
  gained fields, and the screen tests kept the same assertions, which is the evidence that the
  behaviour was unchanged.
- **Lesson** (in AGENTS.md): write out how each NFR flows through an interface before building
  on it.

### Also available: FL-015, verifying a third-party service instead of assuming

- The seed was generated without ids, and the docs claimed as fact that MockAPI adds them. It
  doesn't.
- Caught by running the real `/cars` reply through the app's own guard _before_ wiring it in:
  all 10 cars were rejected.
- In PR 5 the same habit (probe, then document) found that MockAPI's `?clientBookingId=` filter
  matches substrings and that no match returns **404, not `[]`**. The idempotency check would
  have misread every "not found" as a server error.

## 7. AI use (facts from `docs/ai-log/`)

- 12 interaction entries (A-001 to A-012) and 16 failure entries (FL-001 to FL-016), counted with
  `ls docs/ai-log/interactions | wc -l` and `ls docs/ai-log/failures | wc -l` once this PR's entries
  existed. (A first draft of these notes stated these counts _before_ the entries existed: FL-016.)
- Every entry leaves `verification` and `decision` to a human (`TODO (Moha)` until filled in).
- AGENTS.md "Lessons learned" has grown one entry per repeatable agent mistake. Several of them
  became lint rules or test guards:
  - FL-005 → `noInlineConfig` and `--max-warnings 0`
  - FL-009 → the inline-style rule
  - FL-011/012 → the console guard
- **Pattern visible in the failure log:** most AI failures were _confident claims that had not
  been checked_:
  - a remembered API path (FL-001)
  - a remembered install flag (FL-003)
  - remembered library idioms (FL-006, FL-011)
  - an assumed third-party behaviour (FL-015)

  Several of the most expensive ones were caught by a check the team had added because of an
  earlier failure.

## 8. Deliberately deferred (for the design document)

- Retries while the app is closed (would need OS background tasks).
- Conflict resolution; multi-device sync (two devices retrying the same booking at the same
  moment could still duplicate it).
- Editing or cancelling bookings.
- Car availability by date: `available` is a static boolean.
- Accounts and authentication: the renter is two plain fields.
- Dark mode: the tokens are defined and tested, but the app ships light
  (`userInterfaceStyle: "light"`).
