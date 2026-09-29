# Agent rules — CarRentalApp

Read this before writing code. It applies to humans and to AI assistants equally.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
Expo SDK 57 is newer than most models' training data — APIs you "remember" may not exist.

Install Expo-related packages with `npx expo install <pkg>` (add `--dev` for dev dependencies)
so versions stay compatible with the SDK. Never hand-edit a version in `package.json` to satisfy
a guess.

Use `--dev`, not `-- --save-dev`. The latter looks equivalent and is not: Expo writes SDK-managed
packages into `dependencies` itself before npm ever sees the flag, so test tooling silently becomes
a runtime dependency. See
`docs/ai-log/failures/FL-003 expo install dev flag puts packages in dependencies.md`.

## Project

A simple car rental app in React Native: browse cars, view a car's details, place a booking.
It starts on dummy data embedded in the repo, then fetches from an API and persists locally.

Stack: Expo SDK 57 + TypeScript, React Navigation (native-stack), React Context API.

Course context: SDU Mobile Software Design & Development, autumn 2026. Six students. The
process is graded alongside the code, which is why this file, the AI log and CI exist.

### Mandatory non-functional requirements

These shape the architecture, so design for them from the start rather than bolting them on:

- **K1 — offline availability.** Data that has already been fetched stays readable with no
  network.
- **K2 — queued writes.** A write that fails is queued and retried with backoff, never
  silently dropped.
- **K3 — visible sync status.** The user can always see whether their data is `pending`,
  `failed` or `completed`.

## Architecture and data flow

```
screens / components
        │  (props, presses)
        ▼
hooks / context          ← loading, error and sync state lives here
        │
        ▼
repositories             ← THE SEAM. decides where data comes from
        │
        ├──► data/dummy        (today)
        ├──► services/api      (later: HTTP)
        └──► storage           (later: cache + retry queue)
```

**Screens never call `fetch` and never touch storage.** They ask a hook; the hook asks a
repository; the repository decides whether the answer comes from dummy data, the network or
the local cache. That indirection is the entire point: replacing dummy data with the real API
should be a change _inside `src/repositories/` and below_, with no screen edited.

This is not a suggestion. ESLint fails the build on it — see `eslint.config.js`. If a rule
fires, do not add an `eslint-disable`; add or extend a repository instead.

**Hooks expose state as a discriminated union, never loose booleans.** `useCars()` returns
`{ status: 'loading' } | { status: 'error'; error; retry } | { status: 'empty' } | { status: 'ready'; cars }`,
and the screen `switch`es on `status`. TypeScript then refuses to compile a screen that forgot a state.
Something orthogonal to the status, like `isRefreshing` for pull-to-refresh, sits next to the union
and not inside it. A hook ignores any answer that arrives after it unmounts. See `src/hooks/useCars.ts`.

The NFRs land in specific places:

| NFR              | Where it lives today                                                                                                                                                                | Status |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| K1 offline reads | `carRepository` serves `storage/carCache` first, refreshes from `services/api/`, writes back. `useCars` refreshes when the connection returns. `OfflineBanner` + `DataAge` show it. | PR 4   |
| K2 retry queue   | `bookingRepository.syncBooking` leaves unreachable bookings `pending`. The queue with backoff goes in `storage/` under the reserved key `carrental.v1.sync-queue`.                  | PR 5   |
| K3 sync status   | `bookingRepository` sets `syncStatus`, `BookingContext` holds it, `SyncStatusBadge` renders it.                                                                                     | PR 3–4 |

**Cache, then refresh.** Every read the user can see offline goes through a repository that:

1. serves the cached copy immediately, if there is one
2. asks the API in the background and, on success, updates both the cache and the UI
3. on failure _with_ a cache, keeps serving the cache and marks it `stale`
4. on failure _without_ a cache, reports the error

A hook never waits for the network when a cached answer exists.

**Storage keys** are `carrental.v<STORAGE_VERSION>.<name>` and hold `{ version, savedAt, data }`.
Only `src/storage/keyValueStore.ts` touches AsyncStorage. Stored data is always read through a
guard from `src/types/guards.ts`, and anything corrupt or outdated reads as "nothing stored". If
you change a stored shape, bump `STORAGE_VERSION`. The keys in use are listed in
`src/storage/README.md`.

**API replies are untrusted.** Every response is validated by a guard before it becomes a domain
object. A malformed reply is an `ApiPayloadError`, never a crash later on.

## Folder structure

```
App.tsx                 root component: NavigationContainer + RootNavigator
index.ts                Expo entry point
__tests__/              ALL tests, mirroring the source tree
src/
  components/           reusable presentational pieces
  screens/              one file per screen
  navigation/           native-stack navigator + RootStackParamList
  context/              React Context providers for cross-screen state
  hooks/                useX hooks connecting UI to repositories
  repositories/         the seam — only layer that knows the data source
  services/api/         HTTP client, one module per resource
  storage/              AsyncStorage / SQLite wrapper, cache, retry queue
  data/dummy/           hard-coded sample data (temporary by design)
  types/                shared domain types — from the design doc's class diagram
  theme/                colours, spacing, font sizes
  utils/                small pure helpers
```

Every folder has a `README.md` saying what belongs there and what does not. Read it before
adding a file to that folder.

**Do not invent domain types.** `Car`, `Booking` and friends come from the class diagram in
the design document. Update the diagram first, then mirror it in `src/types/`.

## Conventions

**TypeScript**

- `strict: true`. No `any` — ESLint errors on it. If a type is genuinely unknown, use
  `unknown` and narrow it.
- Prefer `type` aliases for props; export them next to the component.
- Types used by one module stay in that module. Only shared types go in `src/types/`.

**React**

- Function components and hooks only. No classes.
- One component per file. When a screen passes ~150 lines, extract a component.
- Lists render with `FlatList`, never `.map()` into a `ScrollView`.
- Touchables use `Pressable`, not `TouchableOpacity`.
- `SafeAreaView` comes from `react-native-safe-area-context`, not from `react-native`.

**Styling**

- `StyleSheet.create` at the bottom of the file. No inline style objects — they allocate on
  every render and cannot be reused.
- Inline style objects fail lint in `src/**/*.tsx` (`no-restricted-syntax` in `eslint.config.js`).
- Every colour, spacing value, radius, font size and animation duration comes from
  `src/theme/`. Nothing in `src/` hard-codes a hex, a size or a duration. If the token you need
  does not exist, add it to the theme (and to its README) rather than inlining it.
- Colours come from `useTheme().colors`, not from `lightColors` directly, so dark mode works
  when we switch it on. Read `src/theme/README.md` for the design direction.

**Motion and accessibility**

These are accessibility requirements, audited and graded — not polish to skip under time pressure.

- **Every animation degrades to no animation when reduce motion is on.** Read
  `useReducedMotion()` from `src/hooks/` and use a duration of 0, or skip the animation
  entirely, when it returns `true`. An animation that ignores it is a bug.
- Durations and easings come from `src/theme/motion.ts`. No ad-hoc millisecond values.
- Anything tappable is at least `minTouchTarget` (44pt) in both dimensions. Use `hitSlop` when
  the visible element must be smaller.
- Never set `allowFontScaling={false}` or `maxFontSizeMultiplier`. Layouts must work at 200%
  text size: let text wrap, avoid fixed heights on text containers.
- Status is never shown by colour alone. The `status.*` colours always come with a label or
  an icon.
- Every new colour pair gets a row in `__tests__/theme/colors.test.ts`, which checks it against
  WCAG AA.

**Naming**

- Components: `PascalCase.tsx` (`CarCard.tsx`), default-exported.
- Hooks: `useCamelCase.ts` (`useCars.ts`).
- Everything else: `camelCase.ts` (`carRepository.ts`, `formatPrice.ts`).
- Tests: `<subject>.test.ts(x)` under `__tests__/`, mirroring the source path.

**Dependencies**

- No new dependency without a stated reason in the PR description: what it does, why the
  standard library or an existing dependency is not enough, and its size.
- Install with `npx expo install`, not `npm install`, for anything Expo-related.

## Testing

All tests live in the top-level `__tests__/` directory, mirroring `src/`:

```
__tests__/App.test.tsx                        -> App.tsx
__tests__/repositories/carRepository.test.ts  -> src/repositories/carRepository.ts
__tests__/screens/CarListScreen.test.tsx      -> src/screens/CarListScreen.tsx
```

Rules:

- **Every feature and every fix ships with a test.** A PR that changes behaviour and adds no
  test gets sent back.
- **Acceptance criteria map to test names.** A Gherkin scenario from the design document
  becomes the `it(...)` string, so a reviewer can trace a requirement to the test that covers
  it. `Given a car list, When the user taps a car, Then the details screen opens` becomes
  `it('opens the details screen when the user taps a car')`.
- Repositories and utils get plain unit tests — no rendering. That is the payoff for keeping
  them free of React.
- Screens are tested with `@testing-library/react-native`, querying the way a user would
  (`getByText`, `getByRole`) rather than by test ID where a visible label exists.
- A bug fix starts with a test that reproduces the bug.
- **Time in tests.** Repositories answer after a simulated latency. Use fake timers and advance them
  by explicit amounts (`jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS)`), inside `act` when
  anything is rendered. Never `runAllTimers`: the loading skeleton pulses forever, so "run every
  timer" never finishes.
- **Console output fails the test.** Any `console.error` or `console.warn` during a test fails it
  (`jest.setup.js`). A test that _expects_ a warning opts in with
  `jest.spyOn(console, 'error').mockImplementation(() => {})` and asserts on the spy. Do not opt in
  to hide a warning you do not understand; fix the cause (FL-011, FL-012).
- **Lists in tests.** `FlatList` renders more rows on a timer. A test that renders one uses fake
  timers and calls `act(() => jest.runOnlyPendingTimers())` in `afterEach`. Otherwise the timer can
  fire after the test and log an intermittent `act()` warning (FL-012).
- **Screens that need a provider or navigator context get it in the test.** For example, wrap the
  screen in `BookingProvider repository={createInMemoryBookingRepository()}` and a
  `HeaderHeightContext.Provider`, instead of mocking the hooks.

## Definition of Done

A change is done when all of these are true:

- [ ] `npm run check` passes locally (lint, format:check, typecheck, test:ci).
- [ ] Tests cover the new behaviour, and their names trace to acceptance criteria.
- [ ] No new `any`, no `eslint-disable` added to get around the architecture guardrail.
- [ ] Folder READMEs still describe reality; AGENTS.md updated if a convention changed.
- [ ] **An AI log entry exists if AI was used** (see below), and its `A-###` ID is in the PR.
- [ ] Opened as a pull request — never pushed straight to `main`.
- [ ] **Reviewed and approved by a teammate who did not generate the code.**
- [ ] CI is green.

"The model wrote it and it ran" is not verification. Verification means you ran it, read it,
and can explain it.

## AI logging rule

The course requires every significant AI interaction to be disclosed and logged. "Significant"
means it produced or changed code, architecture, tests or docs that ended up in the repo —
not autocompleting a variable name.

**After any significant task, the agent must either write the interaction entry itself or tell
the human to run `/log-ai`.** Do not end a task silently.

An entry records: ID, date, author, tool, mode, area, task, prompt or link, verification,
decision (kept / modified / discarded), related PR — plus an honest evaluation of how well the
AI did and the alternatives the team looked up _without_ AI.

An agent must **never invent the `verification` or `decision` fields.** Those describe what a
human did and only a human can fill them in. Leave them as `TODO` and say so.

There is also a failure log (`FL-###`) for AI output that was wrong or off-spec: what it got
wrong, how it was caught, how it was fixed. The course requires at least three real entries.
Write them when they happen — do not reconstruct them the night before the deadline.

Details and templates: [`docs/ai-log/README.md`](docs/ai-log/README.md).

## Every line is defensible

Any team member may be asked to explain or live-modify any line of this codebase. Write code
that a teammate can read cold. Clever beats nothing; clear beats clever.

If an AI produces something you cannot explain, that is not a shortcut you took — it is a
question you have not answered yet. Simplify it until you can explain it, or discard it and
log it as a failure.

## Lessons learned / known agent mistakes

Append to this section whenever an agent gets something wrong in a way that would repeat.
Each entry: what the agent did, why it was wrong, what to do instead. Link the `FL-###` note.

Its git history is evidence of what we learned.

<!-- Add entries below. Newest last. -->

### Do not mock a warning you have not seen

An agent setting up Jest wrote a `jest.setup.js` mocking
`react-native/Libraries/Animated/NativeAnimatedHelper` — a remembered path that does not exist in
React Native 0.86 — to silence a warning that had never appeared. The suite failed to run outright.

**Instead:** run the suite first. Mock only what actually breaks. `jest-expo` already mocks the
native side of Expo and React Native. See `docs/ai-log/failures/FL-001 stale react native animated mock.md`.

### Graded metadata fields need definitions, not just an enum

An agent filed a tooling session's AI log entry under `area: structure`, which is the design-doc
plane (navigation and data model), not tooling. Given a list of allowed values, an agent picks a
plausible-sounding one.

**Instead:** when a field is graded, write the distinction next to it. Tooling and infrastructure are
`area: code`. See `docs/ai-log/failures/FL-002 wrong area for setup log entry.md`.

### Never document the thing you just worked around

An agent hit `npx expo install … -- --save-dev` putting packages in `dependencies`, moved them by
hand — and then wrote that same broken command into this file as the rule for the whole team.

**Instead:** if you worked around something, the workaround is the news. Fix the rule, do not enshrine
the bug. Treat any rule an agent adds to AGENTS.md as a claim to be tested.
See `docs/ai-log/failures/FL-003 expo install dev flag puts packages in dependencies.md`.

### Import Google Fonts per weight, not from the package root

An agent loaded three Schibsted Grotesk weights with
`import { SchibstedGrotesk_400Regular, … } from '@expo-google-fonts/schibsted-grotesk'`. The package
root `require()`s all twelve `.ttf` files, so the bundle shipped ~1.2 MB of fonts to use ~300 KB.
Tests and typecheck were green; only `npx expo export` listing the bundled assets showed it.

**Instead:** import each weight from its subpath (`…/schibsted-grotesk/400Regular`), and after adding
any asset-bearing package, run `npx expo export` once and read the asset list.
See `docs/ai-log/failures/FL-004 font package root bundles every weight.md`.

### Fix the warning, never the linter

An agent silenced `react-hooks/exhaustive-deps` in `CarCard` with an `eslint-disable-next-line`,
justified by a comment that turned out to be wrong: the full dependency list was harmless, and the
empty one hid a real reduce-motion bug. Nothing would have caught it. The rule is only a warning, and
`expo lint` used to exit 0 on warnings.

**Instead:** fix what the rule is pointing at. If you believe the rule is wrong for this case,
explain why in the PR and let a human decide. `src/` now ignores inline ESLint config
(`noInlineConfig`), and `npm run lint` fails on any warning (`--max-warnings 0`), so this is enforced.
See `docs/ai-log/failures/FL-005 eslint disable written to silence a warning.md`.

### Read the lockfile diff after every install

An agent ran `npm install <pkg>@^x.y.z` to _declare_ a package that was already installed. The caret
range made npm upgrade three navigation packages and drop five transitive ones. Every check still
passed.

**Instead:** after any install, run `git diff package-lock.json | grep '"version"'` and confirm that
only what you meant to change moved. To declare something already installed, use the exact version.
See `docs/ai-log/failures/FL-008 npm install changed more than declared.md`.

### No inline style objects — lint does not check this

An agent wrote `style={[styles.dot, { backgroundColor: … }]}` twice in one session, despite the rule
under Styling. Nothing in `npm run check` catches it.

**Instead:** put theme-dependent values in the component's `createStyles(colors)`, and read your diff
for `style={[… {` before committing. A lint rule for this (`eslint-plugin-react-native`'s
`no-inline-styles`) has been proposed for the team to decide on.
See `docs/ai-log/failures/FL-009 inline style objects despite the rule.md`.

### Animated styles that set the same key do not merge

An agent applied `style={[entranceStyle, pressStyle]}`, where both set `transform`. The second
replaced the first, so the cards stopped rising into place. Tests passed, because Jest doesn't run
animations.

**Instead:** when combining animated styles, check for shared keys. Put each `transform` on its own
`Animated.View`, or build one `transform` array in one `useAnimatedStyle`.
See `docs/ai-log/failures/FL-010 merged transforms cancelled the entrance animation.md`.

### Check the installed version before using an API from memory

This happened twice in two sessions: Reanimated's `sv.value =` (FL-006), and datetimepicker's
`onChange`, which is deprecated in 9.x and logs a warning (FL-011). Both were idioms from older
versions.

**Instead:** before using a third-party API, open the installed package's `index.d.ts` or source,
and check the signature and any deprecation notice. This is the general form of "Expo HAS CHANGED"
at the top of this file.
See `docs/ai-log/failures/FL-011 deprecated datetimepicker onChange from memory.md`.

### Check that a seam can carry every NFR before building on it

An agent designed `CarRepository` as `getCars(): Promise<Car[]>` and commented that the cache (K1)
would later fit "behind this same shape". It could not: cache-then-refresh means two answers, and a
promise resolves once. It had to be replaced a PR later, and every hook and screen test was rewritten.

**Instead:** when you design an interface, write out how K1, K2 and K3 would flow through it. If the
shape cannot express one of them, change the shape now. Treat "no changes needed later" as a claim
to check, not a comfort. See `docs/ai-log/failures/FL-013 repository contract not designed for k1.md`.

### User-facing copy only promises what the app does

An agent wrote "Please contact us" in an error message. The app has no contact channel.

**Instead:** state the fact. No "contact us", "we'll email you" or "we'll retry" unless that path
exists and is tested. What the user can do next is a product decision for the design document.
See `docs/ai-log/failures/FL-014 invented support path in copy.md`.
