---
id: FL-021
date: 2026-09-30
author: Moha
related_interaction: A-014
what_went_wrong: The new "CarListScreen search and filters" tests used the async `await act(async () => jest.runOnlyPendingTimersAsync())` afterEach, which AGENTS.md reserves for tests that render `BookingProvider`; a FlatList test without the retry queue uses the synchronous `act(() => jest.runOnlyPendingTimers())`, as the existing block in the same file does
how_caught: test
fix: Switched that block to the synchronous flush; five further full `npm run check` runs were green
---

# FL-021 — wrong afterEach pattern for list tests

## What went wrong

In [[A-014 ux depth profile favourites filters]], Claude Code added a second `describe` block to
`__tests__/screens/CarListScreen.test.tsx`. For its `afterEach` it copied the async flush from the
BookingScreen and RootNavigator tests:

```ts
afterEach(async () => {
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
  …
});
```

AGENTS.md > Testing is explicit about which one to use. **Lists in tests** use
`act(() => jest.runOnlyPendingTimers())`. **Tests near the retry queue**, and only those, flush
asynchronously, because a retry timer starts an async send. The car list renders no
`BookingProvider`. The existing block twenty lines above in the same file used the right pattern.
The AI copied from the wrong neighbour.

## How it was caught

By the "run `npm run check` five times" rule. In 2 of 8 full runs before the fix, the tests in this block failed
with **"Exceeded timeout of 5000 ms for a hook"**, pointing at that `afterEach`. The later tests in
the file then failed in cascade ("Can't access .root on unmounted test renderer").

Honestly, the evidence is mixed, and this note should not claim more than it shows:

- Both failing runs happened while the whole Mac was stalled. In one, every suite took about 25 s,
  including `formatPrice.test.ts`. In the other, Jest ran for **960 s**, where green runs took
  4.5–13 s. During a later stall, `ps` showed the system daemon `duetexpertd` at ~95 % CPU, with a
  load average of 9.5–15. What caused the two failing runs themselves was not observed.
- In the first stall, an **existing** RootNavigator test with the same async hook also timed out.
  The async hook is a legitimate pattern there, so load alone can break it.
- Measured normally, the new tests take 150–270 ms, no heavier than the existing ones (the heaviest
  is 404 ms).

So what is certain is that the block broke a written rule. That the rule break caused the timeouts
is likely but not proven. The synchronous flush finishes inside one `act` and doesn't wait on
promise ticks, which leaves less to go wrong under load.

A single `npm run check` would not have caught it: it was green the first two times.

## Fix

The block now uses the synchronous flush, with a comment pointing at AGENTS.md. After the change,
and with the machine back to normal load, five consecutive full `npm run check` runs passed:
437/437 each time, with Jest taking 6.9–10.9 s.

The RootNavigator "tabs" block keeps the async flush. It renders `BookingProvider`, so the rule
requires it there.

## Prevention

No new rule: the rule existed and was clear. The AGENTS.md bullet for the async flush now says it
is **only** for tests that render `BookingProvider`, and links here. The lesson for agents is in
the same spirit as FL-001: copy test scaffolding from the nearest test **of the same kind**, not
the nearest test.

The five-run rule earned its keep: this surfaced only on the third of five runs.
