# Development report — raw notes

Raw material for the 5-page development report. **Facts only, no polish.** Every number here was
read from the repository, from `gh`, or from a test run, and its source is given in [brackets].
Where something could not be verified, it says so.

State: branch `chore/handin-prep`, on top of PR #9 (`feat/sync-and-bookings`, open, not yet
reviewed), on 2026-09-30. Numbers that depend on PR #9 being merged are marked.

Related documents: [`requirements-coverage.md`](requirements-coverage.md) (requirement →
files → tests, checked by a test), [`demo-video-script.md`](demo-video-script.md),
[`api/README.md`](api/README.md), [`ai-log/`](ai-log/README.md).

---

## 1. Project at a glance

- A car rental app for Funen/Odense: browse cars, view a car, book it, see the booking's sync
  status. Expo SDK 57, React Native 0.86, TypeScript `strict`, React Navigation 7 (bottom tabs +
  native stack), React Context. [package.json]
- Mandatory NFRs: **K1** offline reads, **K2** failed writes queued and retried, **K3** sync
  status always visible. [AGENTS.md]
- Size: 73 source files, 4,569 lines in `src/`; 3,585 lines of tests.
  [`find src -name '*.ts*' | wc -l`; `cat … | wc -l`]
- 22 runtime and 11 dev dependencies. [package.json]
- API: a MockAPI project, with no backend of our own and no authentication.
  [`docs/api/README.md`, `app.json` → `expo.extra.apiBaseUrl`]

## 2. Conventions and how they are enforced

`AGENTS.md` is the rulebook for humans and AI agents alike. Every folder under `src/` has a README
saying what belongs in it. Where a rule can be checked by a machine, it is:

| Rule                                              | Enforced by                                                                                       | Added                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------- |
| Screens/components never `fetch` or touch storage | ESLint `no-restricted-globals` + `no-restricted-imports` on `src/screens/**`, `src/components/**` | PR #1                   |
| No `any`                                          | ESLint `@typescript-eslint/no-explicit-any: error`                                                | PR #1                   |
| Formatting                                        | Prettier; `format:check`                                                                          | PR #1                   |
| Types                                             | `tsc --noEmit`, `strict: true`                                                                    | PR #1                   |
| No `eslint-disable` in app code                   | `linterOptions.noInlineConfig` on `src/**`                                                        | PR #5, after FL-005     |
| No lint warnings                                  | `expo lint --max-warnings 0`                                                                      | PR #5, after FL-005     |
| No inline style objects                           | ESLint `no-restricted-syntax`, selector `JSXAttribute[name.name=/[sS]tyle$/] ObjectExpression`    | PR #7, after FL-009     |
| No `console.error`/`warn` in tests                | `jest.setup.js` records them and fails the test in `afterEach`                                    | PR #7, after FL-011/012 |
| The API seed matches the dummy cars               | `__tests__/data/dummy/seed.test.ts`                                                               | PR #7                   |
| The requirements table cites real files and tests | `__tests__/docs/requirementsCoverage.test.ts`                                                     | this PR                 |

- **One command runs all of it:** `npm run check` = lint → format check → typecheck → tests.
  [package.json `scripts.check`]
- **CI** (`.github/workflows/ci.yml`) runs the same four steps on every pull request, on Node 22:
  `npm ci`, lint, format check, typecheck, `test:ci`, plus `expo-doctor` as a non-blocking step.
  The check is named "Lint, typecheck and test", and it is a required status check on `main`.
  [ci.yml; `gh api repos/aabodeh/CarRentalApp/branches/main`]
- **Definition of Done** (AGENTS.md): check green; tests trace to acceptance criteria; no new
  `any` or `eslint-disable`; READMEs current; AI log entry; opened as a PR; **reviewed by a teammate
  who did not generate the code**; CI green.
- Conventions kept by review, not by a tool:
  - one component per file; `PascalCase.tsx` / `useX.ts` / `camelCase.ts`
  - `FlatList` for lists, `Pressable` for touchables
  - every colour, size and duration from `src/theme/` tokens
  - theme-aware styles through `createStyles(colors)`
  - tests in `__tests__/` mirroring `src/`, **named after acceptance criteria** (Gherkin →
    `it('opens the details of the tapped car')`)

## 3. Architecture and the repository seam

```
screens / components      render and handle presses; ESLint forbids fetch/storage here
        │
hooks / context           loading, error and sync state as discriminated unions
        │
repositories              THE SEAM — the only layer that knows where data comes from
        ├── services/api/   fetch + timeout + typed errors + runtime guards
        └── storage/        AsyncStorage, versioned envelopes, defensive reads
```

### The concrete payoff: what changed when dummy data became a real API

PR #6 (`930f3c0`) ran entirely on dummy data. PR #7 (`c1331f6`) replaced it with MockAPI plus an
offline cache. Measured with `git diff --shortstat 930f3c0 c1331f6 -- <folder>`:

| Layer                                    | Files changed | Lines added | Lines removed |
| ---------------------------------------- | ------------- | ----------- | ------------- |
| `src/screens`                            | 2             | 9           | 1             |
| `src/components`                         | 7             | 153         | 7             |
| `src/hooks`                              | 5             | 104         | 75            |
| `src/context`                            | 1             | 18          | 3             |
| `src/repositories`                       | 4             | 200         | 67            |
| `src/services`                           | 5             | 188         | 2             |
| `src/storage`                            | 4             | 131         | 1             |
| `src/types`                              | 2             | 72          | 0             |
| `src/utils`                              | 2             | 20          | 0             |
| `src/navigation`, `src/theme`, `App.tsx` | 0             | 0           | 0             |
| **all of `src/`**                        | 33            | 900         | 159           |

- **The screens changed by 10 lines** (9 added, 1 removed), in files that totalled 298 lines at
  PR #6. `src/` as a whole was 3,169 lines then, and changed by 900 added and 159 removed.
  [`git show 930f3c0:<file> | wc -l` over `src/screens/*.tsx` and over `src/**/*.ts(x)`]
  The complete screen diff [`git diff 930f3c0 c1331f6 -- src/screens`]:
  - `CarDetailsScreen.tsx` (+2): passes `fetchedAt` and `freshness` to `CarDetails`.
  - `CarListScreen.tsx` (+7 −1): passes the same two fields to `CarListHeader`.
  - `BookingScreen.tsx`: **unchanged.**
- So no screen learned where data comes from. They only received two new fields to display: the
  data's age, and whether it is a saved copy.
- The component changes (+153) are new UI for K1 (`OfflineBanner` 67 lines, `DataAge` 43 lines),
  not rework of existing components.
- **What the seam did _not_ protect:** the hooks (+104 −75) and the screen _tests_ (3 files,
  +167 −57 [`git diff --shortstat 930f3c0 c1331f6 -- __tests__/screens`]). The repository's
  contract had to change, from a promise to a subscription (see §4 and FL-013). The screen tests
  were moved to the new contract and kept the same assertions.

### Where each NFR lives

- **K1**: `carRepository` serves `storage/carCache` at once, refreshes from the API, writes back,
  and marks the copy `stale` if the API fails. The UI shows `OfflineBanner` and `DataAge`.
- **K2**: the rules are in `repositories/syncPolicy.ts`, the engine in `repositories/syncQueue.ts`.
  The queue is derived from the stored bookings.
- **K3**: `SyncStatusBadge` wherever a booking appears, a sentence saying what happens next,
  `SyncToast` on success after a failure, and a badge on the My bookings tab.
- The full mapping to files and tests is in [`requirements-coverage.md`](requirements-coverage.md).

## 4. Patterns actually used

| Pattern                                   | Where                                                                                  | Why it was needed                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Discriminated unions for screen state** | `CarsState`, `CarState`, `MyBookingsState`, `CreationState`, `LoadState`               | The screen `switch`es on `status`; TypeScript refuses to compile a screen that forgot a state        |
| **Subscription instead of a promise**     | `carRepository.subscribeCars(listener)`                                                | Cache-then-refresh gives two answers (saved copy, then fresh data); a promise resolves once (FL-013) |
| **Stale-while-revalidate**                | `carRepository` + `carCache`                                                           | K1: show the saved copy now, refresh in the background                                               |
| **Idempotency key**                       | `clientBookingId`; `findBookingByClientId` is called before every retry                | A retry whose earlier attempt did arrive must not create a second booking                            |
| **Derived queue**                         | `syncQueue` filters `bookingStore` records with `syncPolicy`                           | K2 with one source of truth; nothing to keep in sync with the bookings                               |
| Repository                                | `src/repositories/*`                                                                   | One layer knows the data source                                                                      |
| Factory + dependency injection            | `createCarRepository`, `createBookingRepository`, `createSyncQueue`                    | Tests build isolated instances with fake API and storage                                             |
| Reducer + Context provider                | `BookingContext`, `bookingReducer` (pure)                                              | Cross-screen booking state; transitions unit-tested without rendering                                |
| Backoff policy as data                    | `RETRY_DELAYS_MS = [2000, 8000, 30000]` in `syncPolicy.ts`                             | The rules in one documented place                                                                    |
| Single-flight                             | `refreshCars` (one shared request), `createBooking` (ref guard), `syncQueue` (one run) | No duplicate requests or bookings from double taps or overlapping triggers                           |
| Guard at the boundary                     | `src/types/guards.ts`, on API replies and on storage reads                             | Untrusted data never becomes a `Car`/`Booking` unchecked                                             |
| Versioned envelope                        | `keyValueStore`: `{ version, savedAt, data }`                                          | An old stored shape is discarded, not misread (`STORAGE_VERSION` 1 → 2 in PR #9)                     |
| Design tokens                             | `src/theme/*`                                                                          | One source for colour, spacing, type and motion; contrast is tested                                  |

## 5. Testing

- **Tools:** Jest through `jest-expo`, `@testing-library/react-native`, fake timers.
  [package.json]
- **Totals:** 46 test suites, 359 tests, all passing. [`npx jest --ci --json`]
  _(This includes PR #9 and this branch. On `main` today: 39 suites, 300 tests.)_
- **Coverage:** statements 96.77 %, branches 89.53 %, functions 96.28 %, lines 97.62 %.
  [`npx jest --ci --coverage`, "All files" row]

### By layer [counted from `npx jest --ci --json`]

| Layer (`__tests__/…`) | Test files | Tests   | What is tested, and how                                                               |
| --------------------- | ---------- | ------- | ------------------------------------------------------------------------------------- |
| `utils`               | 9          | 64      | Pure functions: dates, prices, validation. No rendering.                              |
| `repositories`        | 4          | 51      | Cache-then-refresh, booking sync, the retry queue. Fake API and storage, fake timers. |
| `components`          | 11         | 49      | Rendered with Testing Library; queried by role, label and text.                       |
| `screens`             | 4          | 38      | Whole screens through the UI; every state; navigation calls.                          |
| `theme`               | 1          | 36      | WCAG contrast computed for every colour pair, both schemes.                           |
| `types`               | 1          | 27      | Runtime guards accept valid data and reject each kind of invalid data.                |
| `hooks`               | 5          | 25      | `renderHook`; state unions; subscription and unsubscription.                          |
| `context`             | 2          | 17      | The reducer (pure) and the provider: queue triggers, double-submit guard.             |
| `data`                | 2          | 16      | Dummy cars are valid; the API seed matches them and passes the app's guard.           |
| `services`            | 2          | 15      | The API client: success, timeout, 500, malformed payload, network error.              |
| `storage`             | 2          | 12      | Round-trip, corrupt JSON, version mismatch, wrong shape.                              |
| `docs`                | 1          | 5       | The requirements table cites files and tests that exist.                              |
| `navigation`          | 1          | 3       | Tabs open and switch; the tab badge.                                                  |
| `App` (root)          | 1          | 1       | Smoke test: the app boots to the car list.                                            |
| **Total**             | **46**     | **359** |                                                                                       |

### Growth [`npm run check` output recorded in A-008…A-012, and this branch]

| After        | Suites | Tests |
| ------------ | ------ | ----- |
| PR #4        | 10     | 90    |
| PR #5        | 17     | 133   |
| PR #6        | 29     | 208   |
| PR #7        | 38     | 299   |
| PR #8        | 39     | 300   |
| PR #9 (open) | 45     | 354   |
| this branch  | 46     | 359   |

### How the tests are kept trustworthy

- **Names trace to acceptance criteria.** A Gherkin scenario becomes the `it(...)` string.
- **Mocks only after a suite failed without them** (the rule from FL-001). The global ones are:
  - the Reanimated/Worklets Jest setup
  - the AsyncStorage library's own mock
  - an `expo-network` mock (the real hook crashes on unmount under jest-expo)

  [jest.setup.js]

- **Warnings fail tests.** Any `console.error`/`warn` fails the test that produced it.
- **Time is explicit.** Fake timers are advanced by stated amounts, never with `runAllTimers`.
- **Mutation checks.** The code was broken on purpose to confirm a test fails:
  - the unavailable-car guard
  - the double-submit guard
  - the idempotency lookup
  - the inline-style lint rule (three forms)
  - the console guard
  - the no-`eslint-disable` rule
  - the seed drift test
  - the requirements-table test (three kinds of error)

  [A-009…A-013]

- **Repeated runs before a PR.** `npm run check` was run 5 times before PR #7 and PR #9, with 0
  console lines in each run. [A-011, A-012]

### What the tests do not prove

These need a device, or the live API, and are listed as device checks in the PRs:

- animation feel
- haptics
- the native date pickers
- the keyboard not covering the submit button
- 200 % text size
- VoiceOver/TalkBack actually reading labels
- real airplane-mode transitions and real backoff timing
- the live MockAPI (tests stub `fetch`)

## 6. The debugging story: what the API really does

**Recommended for the report.** It has a symptom, a wrong assumption, a method, a fix, and a
change that stops it recurring. Sources: FL-015, A-011, A-012, `docs/api/README.md`.

1. **Symptom (PR #7).** The MockAPI project was set up by pasting a seed file of 10 cars. Before
   putting the API's URL into the app, its `/cars` reply was fetched and run through the app's own
   validation (`isCarArray`). **All 10 cars were rejected.**
2. **What we had assumed.** The seed had been generated _without_ an `id`, and the project's
   documentation stated as fact that "MockAPI numbers the cars 1 to 10". Nobody had checked.
   (The plan had said MockAPI "may" renumber them; by the time it reached the README, the "may"
   had become a fact.)
3. **How the real cause was found.** Every other field matched the seed exactly, and the ids were
   simply absent: MockAPI's data editor stores pasted JSON as-is. Had the URL been wired in
   unchecked, the app would not have crashed. Its guard would have thrown `ApiPayloadError` and
   the list would have shown "Couldn't load the cars". That's the design working, but the cause
   would have been far harder to find from a phone than from a terminal.
4. **Fix.** The seed now carries ids. A test asserts that the seed passes the same guard the app
   applies to API replies, so a seed the app would reject can no longer be committed.
5. **What changed so it can't recur.** A rule in AGENTS.md: _an external service's behaviour is
   not a fact until it has been observed_. Until then it is documented as "expected, unverified".
   The README marked the next assumption ("MockAPI generates ids on POST") as **unverified**
   rather than repeat the mistake.
6. **The rule paid off one PR later (PR #9).** Before the retry queue was written, two probe
   bookings were POSTed to the real API, read back, and deleted. That showed two behaviours nobody
   had guessed:
   - `GET /bookings?clientBookingId=x` matches **substrings**: asking for `probe-a` also returned
     `probe-ab`. A retry could have concluded "the server already has this booking" because of a
     _different_ booking. The match is now made exactly, in the client.
   - When nothing matches, MockAPI answers **`404 "Not found"`, not `[]`**. An empty collection
     does return `[]`, so this only shows once data exists. The idempotency check would have read
     every "not there yet" as a server error, and never sent the booking. The client now reads 404
     on that lookup as "not on the server".

   Both were found in a few minutes with `curl`, before any code depended on them. Both would have
   been very hard to diagnose later, as "bookings randomly never sync".

**Alternatives, shorter:**

- **FL-012, an intermittent warning.**
  - A test run printed an `act()` warning, yet every test passed and CI was green.
  - It was reproduced by running the suite 6 times and tagging each warning with its file: 3 of 6
    runs, always the car-list tests.
  - Cause: `FlatList` renders more rows on a timer, which sometimes fired after the test ended.
  - Fix: fake timers, flushed inside `act`. Afterwards 8 of 8 runs were silent.
  - Consequence: the team made any console warning fail its test. In PR #9 that guard caught the
    same kind of bug again, within minutes.
- **FL-013, the contract that couldn't carry K1.**
  - PR #5 defined `getCars(): Promise<Car[]>`, with a comment saying the cache would later fit
    "behind this same shape".
  - Planning PR #7 showed it could not: cache-then-refresh needs two answers.
  - The contract became a subscription. The hooks and screen tests were rewritten; the screens
    changed by 10 lines (§3).

## 7. Process, stated plainly

All figures from `gh pr view N --json author,mergedBy,mergedAt,reviews` and `gh pr checks N`, read
on 2026-09-30.

| PR  | Merged (UTC)     | Merged by                 | Approving review from a non-author | CI   |
| --- | ---------------- | ------------------------- | ---------------------------------- | ---- |
| #1  | 2026-09-22 08:42 | aabodeh                   | **none recorded**                  | pass |
| #2  | 2026-09-22 08:49 | moha-ech (**its author**) | **none recorded**                  | pass |
| #3  | 2026-09-22 09:26 | aabodeh                   | aabodeh                            | pass |
| #4  | 2026-09-28 13:34 | aabodeh                   | aabodeh                            | pass |
| #5  | 2026-09-28 14:11 | aabodeh                   | aabodeh                            | pass |
| #6  | 2026-09-29 06:14 | aabodeh                   | aabodeh                            | pass |
| #7  | 2026-09-29 14:56 | aabodeh                   | aabodeh                            | pass |
| #8  | 2026-09-29 16:46 | moha-ech (its author)     | aabodeh                            | pass |
| #9  | open             | —                         | none yet (`REVIEW_REQUIRED`)       | pass |

Every pull request was authored by `moha-ech`.

- **PR #1 was merged without a recorded review, and PR #2 was merged by its own author without a
  review.** Both were on 2026-09-22, the setup day, before branch protection was applied.
- **Every PR since (#3 to #8) has an approving review from a teammate who did not author it, and
  passed CI.** Nothing was pushed straight to `main`.
- PR #8 was merged by its author, _after_ a teammate's approval. That satisfies the rule ("reviewed
  and approved by a teammate who did not generate the code"); it is noted for completeness.
- **One thing to resolve before the report is written:** the AI log entry for PR #1 (A-003) has a
  human-filled `verification` field saying it was "reviewed and approved by a teammate before
  merge". GitHub records no review on PR #1. If the review happened in person, say so in both
  places; otherwise the report and the log contradict each other.
  [`docs/ai-log/consistency-report.md`, finding 1]

**When was branch protection turned on?**

- **On 2026-09-22**, according to the project's own log. A-005 records that the repository owner
  applied the settings that day, after PR #2 had been merged, and that `main` then reported
  `protected: true`. PR #3, created at 09:24 UTC the same day, is the first with an approving
  review.
- **The exact time is not recorded anywhere we can read**, so the window is 2026-09-22 between
  08:49 UTC (PR #2 merged) and about 09:24 UTC (PR #3 opened). This is inferred, not read from a
  log. **The repository owner can confirm the exact time in GitHub → Settings → audit log.**
- What can be read today without admin rights: `main` is protected, and "Lint, typecheck and test"
  is a required status check. PR #9 shows `REVIEW_REQUIRED`, so an approving review is required
  too. The rest of the protection settings are not readable by a non-admin (the API returns 404).
  [`gh api repos/aabodeh/CarRentalApp/branches/main`]
- One inconsistency to be aware of: A-005 recorded the merge setting as squash-only on 2026-09-22.
  Today the repository allows merge commits as well (`allow_merge_commit: true`), and PR #8 was
  merged as a merge commit. The setting was changed at some point after 2026-09-22; when and by
  whom is not recorded. [`gh api repos/aabodeh/CarRentalApp`; `git log --format=%P`]

## 8. AI use

- 13 interaction entries (A-001 to A-013), 19 failure entries (FL-001 to FL-019) and 10 verbatim
  prompts (P1 to P10). [`ls docs/ai-log/interactions | wc -l`, and the same for `failures` and
  `prompts`, counted after this task's own entries were written]
- AGENTS.md "Lessons learned" has 14 entries. [`sed -n '/## Lessons learned/,$p' AGENTS.md | grep -c '^### '`]

- Every interaction entry leaves `verification`, `decision`, _Evaluation_ and _Alternatives
  considered without AI_ to a human. The open ones are listed in
  [`ai-log/consistency-report.md`](ai-log/consistency-report.md).
- Each lesson is a repeatable agent mistake. Four of them became machine checks:
  - FL-005 → `noInlineConfig` and `--max-warnings 0`
  - FL-009 → the inline-style lint rule
  - FL-011/012 → the console guard
  - FL-015 → the seed-passes-the-guard test
- **The pattern in the failure log:** most AI failures were _confident statements nobody had
  checked_:
  - a remembered API path (FL-001)
  - a remembered install flag (FL-003)
  - remembered library idioms (FL-006, FL-011)
  - an assumed third-party behaviour (FL-015)
  - numbers written before they were counted (FL-016, FL-018)
  - a test instruction describing behaviour nobody had run (FL-019)

  Several were caught by a check the team had added because of an earlier failure.

## 9. Deliberately deferred (for the design document)

- Retries while the app is closed (would need OS background tasks).
- Conflict resolution. Multi-device sync: two devices retrying the same booking at the same
  moment could still create it twice, because MockAPI has no unique keys.
- Editing or cancelling a booking.
- Car availability by date: `available` is a static flag.
- Accounts and authentication: the renter is a name and an email.
- Search, filter and sort in the car list.
- Dark mode: the tokens are defined and contrast-tested, but the app ships light
  (`userInterfaceStyle: "light"`).
- Push notifications: the sync notice is in-app only.
