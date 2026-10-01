---
id: A-014
date: 2026-09-30
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 7 — four icon tabs, a local UserProfile that prefills the booking form, favourites with a Saved tab, search and filter chips on the car list, and a polish pass on empty and error states
prompt_or_link: '[[P11]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/11
---

# A-014 — UX depth: profile, favourites, filters

## Prompt

[[P11]], pasted verbatim into Claude Code. The branch was `feat/ux-depth`, off `chore/handin-prep`
(PR #10, open and unreviewed), with the PR to be opened against it. The prompt asked to start in
plan mode and wait for approval. It said existing tests must keep passing unchanged, and that any
test that needed changing was a signal to flag, not to edit quietly.

## Output summary

**Plan-stage findings**, two of them answered by Moha before approval:

1. **`@expo/vector-icons` was not installed.** The prompt said it ships with Expo. In SDK 57 it is
   no longer a dependency of `expo` (checked in `node_modules` and in expo's `package.json`).
   Moha chose to install it. It is imported only as `@expo/vector-icons/Ionicons`, so one font is
   bundled (the FL-004 lesson).
2. **No `STORAGE_VERSION` bump.** The prompt asked for one. The profile and favourites are new
   keys, and no stored shape changed. A bump would have discarded unsent bookings (breaking K2)
   and forced edits to two storage tests. Moha chose not to bump.
3. **Flagged but not asked:**
   - the tab badge counts _failed_ bookings, not pending, and was kept that way;
   - the Bookings tab keeps the accessible name "My bookings", so an existing test is unchanged;
   - the heart sits beside the card's button, not inside it, so VoiceOver can reach it;
   - `preferredLocation` has no consumer. Moha was asked, gave no answer, and the stated default
     was taken: it is stored and edited only.

**What was built** (files under `src/` unless noted):

- Data: `types/profile.ts` (`UserProfile`), guards `isUserProfile` and `isStringArray`,
  `storage/profileStore.ts` and `storage/favouritesStore.ts` (keys `carrental.v2.profile` and
  `carrental.v2.favourites`), and `repositories/profileRepository.ts` and
  `repositories/favouritesRepository.ts`. The repositories are shaped for
  `useSyncExternalStore`, so no new Provider was needed and existing screen tests needed no new
  wrapper. Favourites are a `string[]`, not an entity.
- Validation: `utils/validateRenter.ts`, extracted from `validateBooking`, so the profile form and
  the booking form share the same rules and messages. `validateBooking`'s tests are unchanged.
- Hooks: `useFavourites`, `useProfile`, `useSavedCars`, `useProfileStats`, `useCarFilters`,
  `useDebouncedValue`. Utils: `filterCars`, `nextBooking`.
- UI: `FavouriteButton`, `FilterChip`, `SearchField`, `CarFilters`, `ScreenTitle`, `TextButton`,
  `TabIcon`, `TabLabel`, `ProfileForm`, `ProfileStats`, `LocalOnlyNote`, and an optional icon on
  `StateView`. New screens are `SavedScreen` and `ProfileScreen`. Changed: `CarListScreen`
  (search, chips, no-results), `CarDetails`/`CarDetailsScreen` (heart), `BookingScreen`/
  `BookingForm` (prefill: fills only empty fields and never overwrites what was typed), and
  `RootNavigator` (four tabs; the selected tab gets a filled icon, a bold label and an accent bar).
- Theme: three new tokens: `iconSize`, `favouritePop` and `inputDebounce`. No existing value
  changed.
- `App.tsx` and `jest.setup.js` preload the Ionicons font. The need for the `jest.setup.js` line
  was **seen, not guessed**: a throwaway test showed the icon's first render logging an act()
  warning, and the preload removed it.
- Tests: 78 new tests (359 → 437). New files cover the utils, hooks, stores, repositories, the
  new components, and the Saved and Profile screens. Blocks were added to five existing test
  files. `git diff -U0` shows no removed or changed line in any existing test file.
- Docs: `docs/requirements-coverage.md` (F1 evidence, and a "Candidates for the design document"
  section), folder READMEs, and two AGENTS.md edits (FL-020, FL-021).
- Checks: both bundles export. The only new asset is `Ionicons.ttf` (390 KB). The lockfile diff
  adds only `@expo/vector-icons` 15.1.1.

**Errors made and caught in the session:**

- [[FL-020 planned a change an existing test forbids]]: an editorial title on My bookings broke an
  existing test. It was reverted; the test was not edited.
- [[FL-021 wrong afterEach pattern for list tests]]: the wrong `afterEach` flush in the new list
  tests. It failed as hook timeouts in 2 of 8 full runs before the fix during machine stalls.
- Smaller ones, each caught at once by the next run and not logged separately:
  - a test matcher from memory (`toHaveAccessibilityState`), which RNTL 13 does not have;
  - a Saved test that asserted the error after pressing "Try again", which is already back to
    loading by then;
  - two test files that Jest ran fine but `tsc` rejected (untyped `renderHook` props, a
    `setImmediate` callback). The first full `npm run check` caught these before any commit.

**Not verified by the AI:** nothing was run on a device or a simulator. The PR lists what only a
device can show.

## Evaluation

TODO (Moha): how well this went, and what had to be changed by hand. Only a human can judge this.

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (Expo docs on icons, React Navigation's tab
bar docs, the React `useSyncExternalStore` docs, …) and whether it agreed. Leave "none" only if
that is true.
