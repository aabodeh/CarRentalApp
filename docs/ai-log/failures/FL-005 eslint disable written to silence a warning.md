---
id: FL-005
date: 2026-09-28
author: Moha
related_interaction: A-009
what_went_wrong: Wrote `// eslint-disable-next-line react-hooks/exhaustive-deps` in CarCard to silence a dependency warning instead of fixing the dependency list, despite AGENTS.md forbidding eslint-disable workarounds
how_caught: code review
fix: Listed the real dependencies (`[animateIn, index, progress]`), which turned out harmless and better; `src/` now has `noInlineConfig` and `npm run lint` fails on any warning
---

# FL-005 — eslint disable written to silence a warning

## What went wrong

During [[A-009 car repository hook and list screen]], Claude Code wrote the staggered-entrance effect
in `src/components/CarCard.tsx` with an empty dependency array. To stop ESLint complaining, it added
a disable comment:

```ts
  }, []);
  // Entrance runs once, on mount. Re-running on a later reduce-motion change would replay it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
```

AGENTS.md says in two places not to add `eslint-disable` to get around a rule. The comment's
justification ("re-running would replay it") was also **wrong**. Re-running `withTiming(1)` on a
value that is already 1 does nothing. And the empty array hid a real bug: if the OS's reduce-motion
answer arrived after the card mounted, the card would not have snapped into place.

## How it was caught

The AI caught it on self-review, before running lint, while reading back what it had just written.
That makes it _AI_ self-review, not human code review. `how_caught: code review` is the closest
value in the enum.

Would anything else have caught it? **No — and that's the reason this entry exists.**

- `react-hooks/exhaustive-deps` is only a _warning_ in `eslint-config-expo`.
- `expo lint` exits 0 when there are warnings, so `npm run check` and CI pass whether or not the
  disable is there.
- A disable comment is invisible to typecheck and tests.

The only remaining safety net was a human reviewer reading every line.

## Fix

- The effect now lists its real dependencies, `[animateIn, index, progress]`, and has a comment
  explaining why re-running is safe. It is in commit `d58c89c`. The disable was never committed.
- `eslint.config.js` sets `linterOptions: { noInlineConfig: true }` for `src/**` and `App.tsx`, so an
  inline disable is ignored and the underlying warning surfaces.
- The `lint` script is now `expo lint --max-warnings 0`, so warnings fail `npm run check` and CI.
- I verified both changes by planting the exact disable back into `CarCard`. `npm run lint` exited 1
  with it and exits 0 on the real tree.

## Prevention

- Done: the lint config and script changes above make the AGENTS.md rule mechanical instead of a
  matter of trust.
- Done: an AGENTS.md "Lessons learned" entry: **fix the warning, never the linter.**
