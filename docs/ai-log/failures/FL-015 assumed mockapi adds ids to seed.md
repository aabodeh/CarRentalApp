---
id: FL-015
date: 2026-09-29
author: Moha
related_interaction: A-011
what_went_wrong: Generated the MockAPI seed without `id` and documented as fact that "MockAPI numbers the cars 1–10" — never checked; MockAPI's data editor stores pasted JSON as-is, so all 10 cars were served without an id and every one failed the app's `isCar` guard
how_caught: manual testing
fix: Seed now carries ids "1"–"10" (drift test updated, plus a test that the seed passes `isCarArray`); docs state the observed behaviour and mark the unverified POST-id behaviour as unverified
---

# FL-015 — assumed MockAPI adds ids to the seed

## What went wrong

In [[A-011 api offline cache and banner]], Claude Code generated `docs/api/cars.seed.json` from the
dummy cars **without** their `id`. It told Moha to paste it into MockAPI's data editor, and wrote
this in `docs/api/README.md`:

> MockAPI numbers the cars `"1"` to `"10"`.

That was never checked. The plan had hedged it ("MockAPI _may_ renumber…"). Between the plan and
the README, the hedge became a statement of fact. In reality, MockAPI's data editor stores pasted
JSON as-is: `GET /cars` returned 10 cars with no `id` at all.

This is the pattern from FL-003 and the AGENTS.md lesson "Never document the thing you just worked
around": an unverified belief written into the project's documentation as a rule.

## How it was caught

Moha created the MockAPI project by following the AI's step-by-step instructions and sent the URL.
Before putting it in `app.json`, the AI fetched `/cars` and ran the reply through the app's **own**
guard (`isCarArray`, compiled from `src/types/guards.ts`). It returned `false`, with all 10 cars
invalid and ids empty. Every other field matched the seed exactly.

Would it have been caught otherwise? Yes, **safely**, and that's the design working. The first
launch would have validated the reply, thrown `ApiPayloadError`, and shown "Couldn't load the
cars", instead of accepting cars without ids and crashing later on navigation or booking. But the
cause would have been much harder to find from a phone than from a terminal. Checking real data
against the guard **before** wiring it in is what turned it into a two-minute fix.

## Fix

- `cars.seed.json` now carries ids `"1"` to `"10"`, in the dummy cars' order.
- `seed.test.ts` checks the seed against the dummy cars _with_ those ids, **and** that the seed
  passes `isCarArray`, the same guard the app applies to API replies. A seed that would fail
  validation can no longer be committed.
- `docs/api/README.md` now states what was observed: pasted data is stored as-is. It also marks
  the next assumption, that MockAPI generates ids for POSTed bookings, as **not verified yet**,
  instead of repeating the same mistake one resource over.
- Moha re-pastes the new seed.

## Prevention

- An AGENTS.md "Lessons learned" entry: **behaviour of an external service is not a fact until
  observed.** Write "expected, unverified" in docs until it has been, and check real responses
  against the app's guards before relying on them.
- The seed test now includes the guard check. That's the test-level prevention.
