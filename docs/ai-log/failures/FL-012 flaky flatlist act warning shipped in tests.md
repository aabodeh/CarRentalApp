---
id: FL-012
date: 2026-09-28
author: Moha
related_interaction: A-009
what_went_wrong: The CarListScreen tests (PR #5, merged to main) used real timers, so FlatList's deferred row-rendering timer sometimes fired after a test ended and logged "An update to VirtualizedList inside a test was not wrapped in act(...)" — intermittently, about half of full runs
how_caught: test
fix: CarListScreen tests now use fake timers and flush pending timers inside act() in afterEach; 8 of 8 full runs afterwards printed no console output
---

# FL-012 — flaky FlatList act warning shipped in tests

## What went wrong

The `CarListScreen` tests written in [[A-009 car repository hook and list screen]] rendered a
`FlatList` with real timers. `VirtualizedList` renders more rows in a batch scheduled with
`setTimeout`. When that timer fired after a test's last assertion, React logged:

```
An update to VirtualizedList inside a test was not wrapped in act(...)
  at Timeout._updateCellsToRender (…/VirtualizedList.js:1806)
```

It was **intermittent**. It showed in 3 of 6 full runs during
[[A-010 details booking flow and context]], and never during the runs in A-009, which is why A-009
and PR #5 were reported clean. PR #5 was merged, so the flaky test is on `main`.

## How it was caught

During A-010, the final `npm run check` before opening the PR printed a `console.error` that
earlier runs hadn't. Rather than re-run until it went away, the AI reproduced it: 6 full runs,
tagging each warning with the suite it came from. All of them came from
`__tests__/screens/CarListScreen.test.tsx`.

Would anything else have caught it? Only a person reading the output on an unlucky run. The tests
**pass** with the warning, so `npm run check` and CI stay green. An intermittent warning also
teaches a team to ignore console output, which is how real problems end up ignored too.

## Fix

The `CarListScreen` tests now use `jest.useFakeTimers()`. In `afterEach` they call
`act(() => jest.runOnlyPendingTimers())` before switching back to real timers. The list's batch
timer is therefore always flushed deliberately, inside `act`. It is not `runAllTimers`, which
never finishes while a skeleton is pulsing (see the AGENTS.md testing rules). Afterwards,
**8 of 8** full runs printed zero `console.error` or `console.warn` lines.

## Prevention

- The AGENTS.md testing rule about time now also covers `FlatList`: a test that renders a list
  uses fake timers and flushes them inside `act`.
- This is the second time "noticing console output" was the only safety net (see FL-011). Worth
  deciding as a team: fail any test that logs `console.error` or `console.warn`, so intermittent
  warnings can't hide. Not done here, because it changes every suite.
