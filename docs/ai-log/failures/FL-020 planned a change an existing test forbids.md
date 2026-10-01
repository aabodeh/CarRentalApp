---
id: FL-020
date: 2026-09-30
author: Moha
related_interaction: A-014
what_went_wrong: The approved plan gave My bookings an editorial "My bookings" title as a heading, but an existing test (`MyBookingsScreen.test.tsx`, "lists bookings newest first…") asserts that the booking rows are the screen's only headings, so the change broke it
how_caught: test
fix: Reverted the title and kept the native header for that one tab; the test was not edited, and the deviation is stated in the PR and in `RootNavigator.tsx`
---

# FL-020 — planned a change an existing test forbids

## What went wrong

In [[A-014 ux depth profile favourites filters]], the plan for the "visual polish pass" said:

> My bookings gets the editorial display title, like Cars, Saved and Profile, so all four tabs
> share one header language.

Claude Code implemented it with the shared `ScreenTitle` component, which renders the title with
`accessibilityRole="header"`. An existing test pins the screen's headings exactly:

```ts
const headers = screen.getAllByRole('header').map((node) => node.props.children);
expect(headers).toEqual(['Tesla Model 3', 'Fiat 500e']);
```

The new title made that `['My bookings', 'Tesla Model 3', 'Fiat 500e']`. The prompt said existing
tests must keep passing unchanged, and that a test needing a change should be flagged in the plan.
The plan did not flag it, because the AI had not read that screen's tests before proposing to
restructure the screen. It had read the test files for the screens it expected to touch most
(car list, booking, navigator), and assumed the rest.

## How it was caught

The plan had a guard: after wiring the new code, run the **existing** suite before writing any new
tests, and stop if an existing test fails. It failed there, with the diff above.

Without the guard, it would still have been caught by `npm run check` before the commit. The real
risk was the easy fix: adding `'My bookings'` to the expected array would have been one line, and
it would have been exactly the "quiet edit" the prompt forbids.

## Fix

- The title on My bookings was reverted. That tab alone keeps the native header, set in
  `RootNavigator.tsx` with a comment saying why. The state icons on its empty and error views stay.
- The test was not edited. Whether My bookings should get the editorial title, and the test be
  updated to say so, is left to the team, and it's raised in the PR.

## Prevention

A new AGENTS.md lesson: **before a plan changes an existing screen's structure, read that screen's
tests.** A test that pins structure, such as the list of headings, the order of rows or the number
of buttons, is a decision someone made, and the plan must flag it instead of discovering it.
Added to AGENTS.md > Lessons learned.
