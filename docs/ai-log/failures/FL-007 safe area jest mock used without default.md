---
id: FL-007
date: 2026-09-28
author: Moha
related_interaction: A-009
what_went_wrong: Mocked `react-native-safe-area-context` with `jest.requireActual('react-native-safe-area-context/jest/mock')`, but that file is a default export, so `SafeAreaProvider` was undefined and App crashed with "Element type is invalid … got: undefined"
how_caught: test
fix: Use the mock's default export — `jest.requireActual('react-native-safe-area-context/jest/mock').default`
---

# FL-007 — safe area jest mock used without default

## What went wrong

During [[A-009 car repository hook and list screen]], `App.tsx` gained a `SafeAreaProvider`. Under
Jest that provider renders nothing, because it waits for a native layout event that never fires.
That was expected and written into the plan beforehand. The library ships its own Jest mock, and
Claude Code wired it in like this:

```ts
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock')
);
```

`jest/mock.tsx` does `export default { SafeAreaProvider, … }`. `requireActual` returns the module
object, `{ default: {...} }`, so every named import (`SafeAreaProvider`, `SafeAreaView`) became
`undefined`. The AI assumed a module shape it hadn't read.

## How it was caught

The App smoke test failed. The first symptom was unhelpful: "Unable to find node on an unmounted
component", plus a `console.warn` saying an error had occurred in `<App>`, with the real error
swallowed. The AI wrapped `App` in a temporary error boundary in a throwaway test to surface the
actual message, "Element type is invalid … got: undefined. Check the render method of `App`." Then
it read `jest/mock.tsx` and saw the default export. The throwaway test was deleted.

Would it have been caught otherwise? Yes, immediately. Any test rendering `App` crashes. It could
never have reached `main`. What it cost was debugging time, because the first error pointed nowhere
near the cause.

## Fix

```ts
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);
```

The mock is used only in `__tests__/App.test.tsx`, the one suite that renders the provider. It is
not in the global `jest.setup.js`, because only that suite needs it. Commit `7373f3d`.

## Prevention

- The lesson is the existing AGENTS.md one, "Do not mock a warning you have not seen", applied
  again: read the mock file before wiring it in. The existing entry covers it, so no new one.
- A debugging technique worth keeping: when RNTL reports "unable to find node on an unmounted
  component", React has swallowed a render error. A throwaway error boundary shows it in one step.
