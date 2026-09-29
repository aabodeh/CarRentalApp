---
id: FL-010
date: 2026-09-28
author: Moha
related_interaction: A-010
what_went_wrong: While extracting `useEntrance`, CarCard applied `style={[entranceStyle, pressStyle]}` — both animated styles set `transform`, so the press scale replaced the entrance translateY and the cards would no longer rise into place
how_caught: code review
fix: Nested the two animated styles on separate `Animated.View`s (entrance outside, press inside), with a comment explaining why they cannot share a style array
---

# FL-010 — merged transforms cancelled the entrance animation

## What went wrong

During [[A-010 details booking flow and context]], Claude Code extracted the staggered entrance
into a `useEntrance(index)` hook. Refactoring `CarCard` to use it, the AI split the old single
animated style in two and applied both to one view:

```tsx
<Animated.View style={[entranceStyle, pressStyle]}>
```

`entranceStyle` returns `transform: [{ translateY }]` and `pressStyle` returns
`transform: [{ scale }]`. In a React Native style array, a later key **replaces** an earlier one;
it doesn't merge. So `transform` came out as `[{ scale }]` only. The cards would still have faded in,
since `opacity` wasn't overridden, but they would no longer have risen into place. The refactor
silently removed half of a graded animation.

## How it was caught

The AI caught it on self-review immediately after the refactor, while the test suite was green.

Would anything else have caught it? **No.** Reanimated's Jest setup doesn't run real animations,
and no test asserts transform values. It would have looked slightly wrong on a device, and "the
entrance feels flatter than before" is exactly the kind of regression nobody reports. It was never
committed.

## Fix

The entrance goes on the outer `Animated.View` and the press scale on an inner one, with a comment
explaining why they can't share a style array. The refactor commit `c5bebbb` says so in its message.

## Prevention

A new AGENTS.md "Lessons learned" entry: when you combine animated styles, check whether they set
the same key. `transform` in particular doesn't merge, so give each its own view or build one
`transform` array.
