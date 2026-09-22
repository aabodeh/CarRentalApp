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

The NFRs land in specific places:

| NFR              | Where it lives                                                                       |
| ---------------- | ------------------------------------------------------------------------------------ |
| K1 offline reads | repository reads `storage/` cache first, refreshes from `services/api/`, writes back |
| K2 retry queue   | failed writes go to a queue in `storage/`; the repository owns the backoff           |
| K3 sync status   | the repository knows the status; a hook exposes it; a component renders it           |

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
- Shared values (colours, spacing) come from `src/theme/`. Do not hard-code a hex value that
  already exists there.

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
