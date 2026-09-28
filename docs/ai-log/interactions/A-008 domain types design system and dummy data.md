---
id: A-008
date: 2026-09-28
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 1 foundation — domain types, design tokens, motion/a11y rules, dummy cars, utils and tests
prompt_or_link: '[[P5]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/4
---

# A-008 — domain types, design system and dummy data

## Prompt

[[P5]], pasted verbatim into Claude Code. It asked for the design system (tokens for an editorial
ink/paper/orange direction), the animation, image, haptics and font packages, `Car`/`Booking` types
exactly as specified, ten dummy cars for Odense/Funen with verified Unsplash images, four pure utils
with tests, and a contrast test. It asked to start in plan mode and wait for approval.

## Output summary

**Plan stage.** In plan mode, before writing any code, the AI raised three points, and the plan was
approved with its recommendations:

1. **The accent requirement can't be met as written.** Paper (L=0.940) and ink (L=0.006) are so far
   apart that no single colour reaches 4.5:1 against both. The best any colour can do is
   ≈4.21:1 on each. The AI proposed one accent per scheme instead: `#B4460A` in light mode (5.18:1
   on paper) and `#FF7A1A` in dark mode (7.19:1 on ink). The test also proves the 4.21 ceiling.
2. **Type questions, raised but not changed.** `Booking` has no renter field. `syncStatus` is
   local-only state. `available` is static. `createdAt` had no stated format. And the day-count
   rule was undecided: the AI chose 24-hour periods, a same-day rental counting as 1 day, and a
   `RangeError` for a reversed range.
3. **Deviation from the prompt: no babel plugin.** `babel-preset-expo@57` adds the worklets plugin
   automatically, so no `babel.config.js` was written. The AI verified this by transforming a
   sample `'worklet'` function with the preset and finding `__workletHash` in the output.

**Files.**

- `package.json` / `app.json`: installed via `npx expo install`: `react-native-reanimated`,
  `react-native-worklets` (a required peer), `expo-image`, `expo-haptics`, `expo-font` and
  `@expo-google-fonts/schibsted-grotesk`. `expo` was bumped to `~57.0.25` because `expo-doctor`
  flagged a new patch release.
- `src/types/`: `car.ts` and `booking.ts` as specified, plus exported `SyncStatus`, `Transmission`
  and `Fuel` aliases.
- `src/theme/`: `colors` (light and dark sets with the same keys), `spacing` (4pt scale plus
  `minTouchTarget`), `radii`, `elevation` (hairline borders, and a single `raised` shadow),
  `typography` (Schibsted Grotesk, 7 roles), `motion` (durations, bezier easings, `pressScale`),
  and a README describing the design direction.
- `src/hooks/`: `useTheme` (built on `useColorScheme`) and `useReducedMotion`, which also listens
  for the setting changing while the app runs.
- `src/utils/`: `formatPrice`, `formatDateRange`, `daysBetween` and `calculateTotalPrice`, plus a
  fifth helper the prompt did not ask for, `parseIsoDate`. Three of the utils share its strict date
  parsing.
- `src/data/dummy/cars.ts`: ten cars, including the Fiat 500e, Tesla Model 3, Audi A6 Avant
  (the station wagon) and VW Transporter (the van). Two are unavailable.
- `App.tsx`: loads the fonts before the first render.
- `__tests__/`: 10 suites and 90 tests. The contrast suite puts each ratio in its test name.
- `AGENTS.md`: a new "Motion and accessibility" convention block, and a lessons-learned entry.
- `tsconfig.json`: accepts the include rewrite that `expo start` makes every time. It drops the
  expo-router typed-route paths, which we don't use.

**Things the AI decided without being told:** the font (Schibsted Grotesk), every colour except
ink and paper, the day-count semantics above, the exact cars and prices, hard-coding the Danish
month names instead of using `Intl` date formatting (for consistent output across Hermes, Node and
web), and rendering `null` until the fonts load instead of adding `expo-splash-screen`.

**Images.** Many Unsplash photo IDs the AI remembered did resolve, but most turned out to be
supercars. The AI built a contact sheet, looked at every image, and picked matching everyday cars,
some of them found through Unsplash search pages. All ten final URLs return HTTP 200 with
`image/jpeg`. The photos show the right make and model, but the year and trim don't always match;
the README says so.

**Problems during the session, as a factual record:**

- The font import pulled in all twelve weights. That was caught by reading the `expo export` asset
  list and fixed. See [[FL-004 font package root bundles every weight]].
- The first run of the App smoke test failed after font loading was added. The cause was that the
  first render is now `null`, so the test now uses `findByText`. No mock was added.
- Typecheck caught two type errors in the AI's hook tests. One came from assuming that
  `ColorSchemeName` includes `null`; in RN 0.86 it is `'unspecified'`.
- The AI's first URL-check command matched nothing, because it grepped the wrong pattern, and it
  printed a 404 for an empty ID. It was re-run correctly before anything was committed.
- The hook tests were written alongside their implementations, not strictly before them, so they
  were never seen failing.

**Verification the AI ran (AI verification, not human):** `npm run check` passed (lint, prettier,
`tsc`, 90/90 tests). `expo-doctor` passed 21/21. `npx expo start` served the iOS and Android
bundles with HTTP 200 and no warnings. `expo export` showed three font files.

**Not verified by anyone yet:** how any of this renders on a real device, including at 200% text
size, and whether `Intl.NumberFormat('da-DK')` gives the same output on Hermes as in Node, which
is what the tests run on.

## Evaluation

TODO (Moha): a human evaluation of how well the AI did. In particular, look at whether the
per-scheme accent decision holds up for the design doc, and whether the dummy data and images look
right on a device.

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. the WCAG contrast definition, Expo's
font docs, other type or palette options), and whether it agreed with the AI.
