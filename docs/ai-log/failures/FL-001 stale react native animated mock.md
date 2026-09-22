---
id: FL-001
date: 2026-09-22
author: Moha
related_interaction: A-003
what_went_wrong: jest.setup.js mocked react-native/Libraries/Animated/NativeAnimatedHelper, a module path that does not exist in React Native 0.86
how_caught: test
fix: Mock removed. jest-expo already mocks the native side of React Native, so jest.setup.js stays empty.
---

# FL-001 — stale react native animated mock

## What went wrong

While setting up Jest in [[A-003 project setup scaffolding]], Claude Code wrote a `jest.setup.js`
containing:

```js
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});
```

That path is a well-known snippet from older React Native versions, and it does not exist in React
Native 0.86. The `virtual: true` option did not save it either, because the failure came from the
preset's `moduleNameMapper` refusing to resolve the path at all:

```
Configuration error:
Could not locate module react-native/Libraries/Animated/NativeAnimatedHelper mapped as:
/…/node_modules/react-native/$1.
```

This is exactly the failure mode [[P1]] warned about in its opening lines — reaching for a remembered
React Native / Expo API instead of the SDK 57 documentation.

## How it was caught

The test suite failed to run. Not a subtly wrong result — the whole suite errored out on the first
`npx jest` invocation, before the smoke test could execute.

Would it have been caught without that check? Yes, and immediately: the only test in the repo could
not run at all, and `npm run check` and CI both fail on that. This one was impossible to miss. The
more interesting observation is that the mock was written speculatively, to silence a warning that
had not actually appeared yet.

## Fix

The mock was removed and `jest.setup.js` left with only a comment explaining why it is empty: the
`jest-expo` preset already mocks the native side of Expo and React Native. `react-native-screens`
needed no mock either, which was the other thing the session had expected to have to work around.

The smoke test then passed, and has passed on every CI run since.

## Prevention

Already covered by an existing rule rather than a new one: `AGENTS.md` opens by telling agents to read
the SDK 57 docs before writing code, precisely because remembered APIs go stale. This entry is the
concrete evidence for that rule.

The transferable lesson is narrower and worth stating: **do not add a mock for a warning you have not
seen.** Run the suite first; mock only what actually breaks.

Added to "Lessons learned / known agent mistakes" in `AGENTS.md`.
