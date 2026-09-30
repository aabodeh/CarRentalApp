---
id: A-012
date: 2026-09-29
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 5 — K2 retry queue with backoff and idempotent retries, My bookings screen, bottom tabs, retry-success toast, development report notes
prompt_or_link: '[[P9]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/9
---

# A-012 — retry queue, My bookings and tabs

## Prompt

[[P9]], pasted verbatim into Claude Code. The branch was `feat/sync-and-bookings`, from `main` after
#4–#8 were merged. The prompt asked for:

- bookings POSTed with `clientBookingId` as the idempotency key
- a minimum-depth retry queue derived from stored bookings, with 2 s / 8 s / 30 s backoff, then
  manual retry, triggered on foreground, network return and a timer
- a toast announcing that a retry succeeded
- a "Try again" button for failed bookings
- a My bookings screen with bottom tabs
- tests with fake timers
- AGENTS.md updates
- `docs/development-report-notes.md`

It asked to start in plan mode and wait for approval.

## Output summary

**Plan-stage decisions**, approved with the plan:

1. **A probe write to the real API was approved.** Before any code, the AI POSTed two probe
   bookings to the team's MockAPI, read them back through the filter, and DELETEd both. It
   confirmed that `bookings` was empty again and the 10 cars were intact. Observed:
   - POST generates `id` and keeps our fields.
   - `?clientBookingId=` matches **substrings**.
   - No match returns **404 "Not found"**, not `[]`.

   The last one changed the code: without it, the idempotency check would have read every "not
   there yet" as a server error. All of this is recorded in `docs/api/README.md` as observed.

2. **Idempotency is done by the client**, because MockAPI has no unique keys. Before any
   _retry_, the app looks the booking up by `clientBookingId` and compares it exactly. The
   remaining multi-device gap is documented.
3. **The queue is derived, not stored separately.** Bookings are stored as `{ booking, sync }`
   (`attempts`, `nextRetryAt`, `rejected`). The `Booking` type is unchanged. `STORAGE_VERSION`
   went 1 → 2, and the `sync-queue` key reserved in PR 4 was dropped.
4. **Status semantics:**
   - `pending`: never attempted
   - `failed`: failed, with an automatic retry coming, or out of retries, or refused
   - `completed`

   A refused booking (4xx) is not retried automatically.

5. **The tabs are text only.** `@expo/vector-icons` isn't installed, and adding it would be
   another dependency with a font.
6. **`BookingConfirmation` was removed.** A booking now routes to My bookings, as the prompt asked.

**A design change made during implementation**, not in the plan: **no attempts while offline.**
Attempting offline fails instantly, so four attempts would be used up in about 40 s of airplane
mode, and the booking would need a manual retry even after the network returned. Offline bookings
now wait as `pending` and are sent on reconnect. The backoff applies to failures _while online_.

**Things the AI decided without being told:**

- 5xx is treated as retryable.
- Foreground, reconnect and start triggers retry immediately, ignoring the backoff times.
- The toast shows only when a booking succeeds _after_ a failure, not at the first attempt.
- The toast copy, "Your booking for Tesla Model 3 is confirmed.", and a 4 s duration.
- A tab badge counts failed bookings.
- The helper text for each status.
- `useMyBookings` takes car names from the cached car list, falling back to "Car 5".
- No `declare global ReactNavigation` block, which would have needed an `eslint-disable`.

**Files.**

- **Dependencies:** `@react-navigation/bottom-tabs` 7.19.2. It requires native ^7.4.1, so native,
  core and elements each moved a patch and `query-string` was dropped. Both are declared in the
  commit. Separately, expo 57.0.26 and expo-constants 57.0.20, because `expo-doctor` flagged new
  patches.
- `src/storage/`: `bookingStore` (`StoredBooking`, `SyncMeta`, a guard), `keyValueStore`
  (version 2).
- `src/repositories/`:
  - `syncPolicy.ts` (the rules, and the out-of-scope list)
  - `syncQueue.ts`
  - `bookingRepository.ts` (`syncBooking(id, now)`, `resetForManualRetry`, idempotency)
- `src/services/api/bookingApi.ts`: `findBookingByClientId`, which matches exactly and reads 404
  as "not found".
- `src/context/BookingContext.tsx`:
  - runs the queue at start, on foreground (`AppState`) and on reconnect
  - `retryBooking`, `reload`, `notice`
  - a new reducer shape
- `src/navigation/`: `types.ts` (`CarsStackParamList`, `RootTabParamList`, composite props),
  `CarsNavigator.tsx`, and `RootNavigator.tsx` (the tabs).
- `src/screens/`: `MyBookingsScreen.tsx` (new). `BookingScreen` routes to My bookings. The list
  and details screens were retyped.
- `src/components/`: `BookingRow`, `SyncToast` (new). `BookingConfirmation` was deleted.
- `src/hooks/useMyBookings.ts`. The theme gained a `toast` token.
- Docs:
  - AGENTS.md: the K1–K3 table, the queue rules, the deferred depths, the async timer-flush test
    rule, and a widened FL-015 lesson
  - READMEs for storage, repositories, context, components, hooks and navigation
  - `docs/api/README.md` (observed behaviour)
  - `docs/development-report-notes.md`
- Tests: 45 suites, 354 tests (up from 300). They include:
  - 13 fake-timer queue tests (retry, 2/8/30 s spacing, stop at the cap, manual retry, a refused
    booking, notice on success after retry, offline then reconnect, triggers, idempotency,
    restart, single-flight, stop)
  - provider trigger tests: start, reconnect, foreground
  - My bookings in loading, empty, error, ready and offline, plus "Try again"
  - toast tests
  - tab navigation and the tab badge
  - a new WCAG contrast pair for the tab badge

**Problems during the session, as a factual record:**

- [[FL-016 report notes stated counts not yet true]]: the report notes stated log counts that
  didn't exist yet.
- **A commit made before reading the check.** The bottom-tabs commit was made in the same command
  as `expo-doctor`, whose output said "1 check failed". The AI then read it: new Expo patch
  releases, unrelated to the tabs. It fixed that in a separate commit, which leaves the first
  commit's `expo-doctor` state failing.
- **Swapped test values.** A scripted edit swapped the version numbers in two storage tests. The
  "other version" test was then using the current version. It was caught when the test failed,
  and fixed line by line.
- **An aborted edit, with a file already deleted.** A scripted edit to `BookingScreen` aborted on
  an assertion (trailing-comma formatting), after `git rm BookingConfirmation` had already run. It
  was redone with tolerant patterns.
- **An async `act()` warning, in the FL-012 family.** A retry timer that fired in `afterEach`
  started an async send that finished after a synchronous `act`. The console guard added in PR 4
  caught it. The fix is an async flush in the tests near the queue, and a new testing rule in
  AGENTS.md.
- **Leftover test code.** A meaningless helper (`callTimes`) and an assertion that checked
  nothing were written into the queue tests, and removed before the implementation.
- The navigation test was first written into a folder that didn't exist (the heredoc failed), and
  rewritten.
- **A false claim about reviews, caught while checking the notes against FL-016.** The first draft
  of the report notes also said all PRs were "merged through review". `gh pr view` shows #1 and #2
  have no recorded review, and #2 was merged by its author. The notes now state exactly what GitHub
  records.
- **A wrong device test step, corrected after the PR was opened.** The first PR description told
  Moha to rename the MockAPI resource to force an automatic retry. That produces a **404**, which
  the app treats as a refusal: no automatic retries and no toast. It is now a network-degradation
  step (Network Link Conditioner), plus a separate refusal step.
- **Commits that aren't green on their own:** the repositories and context commits, because
  `BookingScreen` only compiles after the navigation commit. Both commit messages say so.

**Verification the AI ran (AI verification, not human):**

- `npm run check` **5 of 5** runs, each with exit 0, 354/354 tests and 0 console lines.
- `expo-doctor` passed 21/21, after the patch bump.
- iOS and Android bundles served with HTTP 200 and no Metro warnings.
- `expo export`: 3 font files, a 3.1 MB bundle. The idempotency mutation check
  passed: without the lookup, both duplicate tests fail, and restored, all 51 repository tests pass.

**Not verified by anyone yet (needs a device):**

- the airplane-mode → online retry path on real network transitions
- `AppState` foreground retries
- the toast's feel and announcement
- the tab bar at 200 % text
- a restart with pending bookings on a real device
- behaviour against real MockAPI POSTs from the app (only the probe requests used the API)

## Evaluation

TODO (Moha): a human evaluation, after running the device script. In particular: is "no attempts
while offline" the right call for the design doc, and are the helper texts clear?

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. how other apps retry, WorkManager or
background tasks for retries while closed, idempotency keys in real APIs), and whether it agreed
with the AI.
