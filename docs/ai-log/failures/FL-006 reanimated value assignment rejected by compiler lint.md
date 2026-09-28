---
id: FL-006
date: 2026-09-28
author: Moha
related_interaction: A-009
what_went_wrong: Wrote Reanimated shared-value updates as `scale.value = withSpring(...)`, which the React Compiler lint rule `react-hooks/immutability` rejects as mutating a hook return value
how_caught: lint
fix: Switched every shared value in CarCard and Skeleton to Reanimated's `.get()` / `.set()` API
---

# FL-006 — reanimated value assignment rejected by compiler lint

## What went wrong

During [[A-009 car repository hook and list screen]], Claude Code wrote the press animation in
`src/components/CarCard.tsx` in the Reanimated style most tutorials and most training data use:

```ts
const handlePressIn = () => {
  if (!reduceMotion) scale.value = withSpring(pressScale, pressSpring);
};
```

This project's lint config (`eslint-config-expo@57`) includes the React Compiler rules. To the
compiler, `scale` is the return value of a hook (`useSharedValue`), so assigning to `.value` is
mutating a value React treats as immutable:

```
error  This value cannot be modified   react-hooks/immutability
```

Reanimated 3.16 and later has a compiler-safe API for exactly this: `sv.get()` and `sv.set(v)`. The
AI didn't use it because the `.value` idiom is what it remembered. It's the same pattern as the
AGENTS.md warning "Expo HAS CHANGED": APIs you remember may not be current.

## How it was caught

`npm run lint` caught it, as two errors. They were errors, not warnings, so the build fails.

Would it have been caught otherwise? Only as runtime trouble. With the React Compiler enabled, it
may memoise the handler in a way that breaks the mutation. It was never a lint-free problem, so
this check did its job.

## Fix

Every shared value in `CarCard.tsx` and `Skeleton.tsx` now uses `.get()` inside
`useAnimatedStyle`, and `.set()` in effects and handlers. Commit `4892471`.

## Prevention

- The lint rule already exists and fails the build, so no new rule is needed.
- `src/components/README.md` now says animated values use `.get()` / `.set()` and why, so the next
  person or agent doesn't have to rediscover it.
- An AGENTS.md "Lessons learned" entry isn't needed: lint already fails loudly and immediately with a
  clear message, so the mistake can't slip through.
