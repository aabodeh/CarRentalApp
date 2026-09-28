---
id: A-009
date: 2026-09-28
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 2 — renter fields on Booking, carRepository, useCars/useCar, CarCard/Skeleton/StateView/Screen, CarListScreen with motion and a11y
prompt_or_link: '[[P6]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/5
---

# A-009 — car repository, hook and list screen

## Prompt

[[P6]], pasted verbatim into Claude Code. The PR was meant to stack on PR #4
(`feat/domain-and-design-system`). #4 was squash-merged mid-session, so, with Moha's approval, the
branch was rebased onto `main` and the PR opened against `main`. The prompt asked for:

- renter fields on `Booking`
- the repository seam with simulated latency
- hooks that return a discriminated union
- four components and the car list screen, with all four states wired
- Reanimated motion gated on reduce motion
- audited accessibility
- Gherkin-named tests

It asked to start in plan mode and wait for approval.

## Output summary

**Plan-stage decisions.** These were raised before any code and approved with the plan:

1. `useCars()` returns `{ state, refresh, isRefreshing }`. `state` is exactly the requested union,
   and `isRefreshing` sits beside it, so pull-to-refresh never hides the list. A failed refresh keeps
   the list that is already on screen.
2. `useCar(id)` gets its own `not-found` status, separate from `error`.
3. An unavailable card says "Not available right now". It doesn't give a more specific reason,
   because `Car` has no field for one and the AI didn't invent one. It stays an accessible button
   with a disabled state.
4. The shimmer is an opacity pulse, which avoids adding `expo-linear-gradient` as a dependency.
5. The list gets an in-screen editorial header ("Cars on Funen", and "10 cars · 8 available")
   instead of the native header.
6. Only the first 6 cards stagger (60 ms apart). Cards that mount later while scrolling appear
   without an entrance animation.
7. Accessibility labels read the price as plain kroner ("1195"), because an English screen reader
   reads the Danish "1.195" as a decimal.

**Deviation from the prompt:** card names use the `title` style (28 px), not `display` (40 px). PR #4's
typography comments reserve `display` for the details screen, and a 40 px "Mercedes-Benz C 200 Coupé
AMG Line" takes three lines in a list card.

**Files.**

- `src/types/booking.ts`: `renterName` and `renterEmail`. `src/utils/daysBetween.ts`: a
  business-rule JSDoc line.
- `src/repositories/carRepository.ts`: the `CarRepository` type, `carRepository`,
  `SIMULATED_LATENCY_MS` (marked temporary) and `CarNotFoundError`. It returns copies.
- `src/hooks/useCars.ts` and `useCar.ts`, plus a small shared helper, `src/utils/toError.ts`.
- `src/theme/`: `stagger`, `entrance`, `pressSpring`, `shimmer`, `opacity` and a `placeholder`
  colour.
- `src/components/`: `CarCard`, `Skeleton`, `StateView`, `Screen` and `CarListHeader`. Styles use a
  `createStyles(colors)` function memoised on the theme, and animated values use `.get()`/`.set()`.
- `src/screens/CarListScreen.tsx`: one `FlatList` for every state, with the state chosen through
  `ListEmptyComponent`. `CarDetailsScreen.tsx` has typed `{ carId }` props and a placeholder body.
- `src/navigation/`: `CarDetails: { carId: string }`, and `headerShown: false` on the list.
- `App.tsx`: a `SafeAreaProvider`.
- `jest.setup.js`: the worklets mock and Reanimated `setUpTests()`. This is the libraries'
  documented setup, added only after the suite failed to load without it.
- `eslint.config.js` and `package.json`: `noInlineConfig` for `src/`, and `lint --max-warnings 0`,
  from FL-005.
- Docs: AGENTS.md (the hook-state union pattern and a new lesson), plus the READMEs for
  `repositories`, `components`, `hooks` and `theme`.
- Tests: 17 suites, 133 tests. That includes 6 Gherkin-named screen tests and one accessibility-label
  test per dummy car.

**Problems during the session, as a factual record:**

- [[FL-005 eslint disable written to silence a warning]]: the AI wrote an `eslint-disable` for
  `exhaustive-deps`. No tool would have caught it. It is now enforced by lint config.
- [[FL-006 reanimated value assignment rejected by compiler lint]]: the AI used the old Reanimated
  `sv.value =` idiom, and lint rejected it.
- [[FL-007 safe area jest mock used without default]]: the AI wired the Jest mock without
  `.default`, and the App test crashed.
- The first version of the CarCard price test had an ordinary space where the price uses a
  non-breaking one, so the test failed. It now asserts against `formatPrice(749)` directly. That was
  a test bug, not a component bug.
- **Process slip:** to mutation-check the "unavailable car does not navigate" test, the AI broke
  `CarCard` on purpose, then tried to restore it with `git checkout`. That does nothing for a file
  that has never been committed, so the broken file stayed on disk. The AI's own follow-up `grep`
  showed it, and it restored from a backup it had taken first. The mutation check itself worked:
  the test fails when the card is pressable.
- The Reanimated testing docs refer to `react-native-reanimated/jest/resolver`, which does not exist
  in the installed 4.5.1. The AI used the Worklets docs' mock instead. That's a docs mismatch, not
  an AI error, but worth knowing.

**Verification the AI ran (AI verification, not human):**

- `npm run check` passed: lint with 0 warnings, prettier, `tsc`, and 133/133 tests.
- `npx expo start` served the iOS and Android bundles with HTTP 200 and no warnings.
- `expo export` bundled 3 font files. The Android bundle grew from 1.9 MB to 3 MB, now that
  Reanimated, Worklets and expo-image are actually imported.
- Two mutation checks: the unavailable-car test, and the `noInlineConfig` + `--max-warnings 0` lint
  change.

**Not verified by anyone yet (needs a device):**

- how the entrance, press spring and shimmer feel
- whether the haptic fires on press-in
- the behaviour with reduce motion switched on
- layout at 200% text size
- the RefreshControl accent tint on iOS and Android
- images loading on a real network
- VoiceOver/TalkBack actually reading the labels and the disabled state

## Evaluation

TODO (Moha): a human evaluation, after testing on a device. In particular: does the motion feel
deliberate rather than decorative, and do the plan-stage decisions (the refresh shape, not-found as
its own status, card names in `title` size) hold up?

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. React Navigation typing docs, Reanimated
docs, WCAG guidance on disabled controls), and whether it agreed with the AI.
