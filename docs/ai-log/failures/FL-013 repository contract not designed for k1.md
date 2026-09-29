---
id: FL-013
date: 2026-09-29
author: Moha
related_interaction: A-009
what_went_wrong: The CarRepository contract written in PR #5 was single-shot (`getCars(): Promise<Car[]>`), which cannot express K1's cache-then-refresh (serve the cache now, the fresh list later), although AGENTS.md says to design for K1–K3 from the start
how_caught: code review
fix: Replaced it with `subscribeCars(listener)` + `refreshCars()` + a cache-first `getCarById`, snapshots carrying `fetchedAt` and `freshness`; hooks subscribe instead of awaiting; screens only consume the new fields
---

# FL-013 — repository contract not designed for K1

## What went wrong

In [[A-009 car repository hook and list screen]], Claude Code designed the seam that every screen
depends on:

```ts
export type CarRepository = {
  getCars(): Promise<Car[]>;
  getCarById(id: string): Promise<Car>;
};
```

Its own doc comment said: "Later: API + local cache (K1), behind this same shape, so no hook or
screen changes." That claim was **wrong**. K1, as AGENTS.md defines it (the repository reads the
cache first, refreshes from the API, and writes back), means a caller hears **two** answers: the
cached cars at once, then the fresh ones. A promise resolves once. The contract could only have
supported K1 in a degraded form: block on the network (not offline-first), or return the cache and
drop the refresh.

AGENTS.md is explicit: "These shape the architecture, so design for them from the start rather than
bolting them on." A-009 had K1 in front of it and still designed a contract that couldn't carry it.

## How it was caught

At plan time in [[A-011 api offline cache and banner]], before any code was written. The PR 4
prompt said "If a screen needs rewriting, the seam was wrong — say so". Planning cache-then-refresh
against the existing contract showed it had to change, and the plan flagged this before starting.

Would it have been caught otherwise? Yes, eventually, and later is worse. Implementing K1 behind
the old shape would have led to one of three outcomes:

- a screen that waits for the network even with a good cache, which **fails K1 on a device** but
  passes every test that mocks `getCars`
- an unplanned contract change in the middle of the PR
- a workaround in a screen

**What it cost:** `useCars`, `useCar` and all the list, details and booking screen tests were
rewritten to the new contract. The screens themselves only gained the new fields, so the seam
held where it mattered.

## Fix

- `subscribeCars(listener)` emits `{ cars, fetchedAt, freshness: 'refreshing' | 'fresh' | 'stale' }`
  snapshots, or an error only when there is no cache.
- `refreshCars()` handles pull-to-refresh and retry.
- `getCarById` is cache-first.
- The hooks subscribe instead of awaiting. `ready` gains `fetchedAt` and `freshness`, and the
  union is otherwise unchanged.

Commit `c1527ab`, on this branch (`feat/api-and-offline`).

## Prevention

A new AGENTS.md "Lessons learned" entry: when you design a seam, write down how each NFR would flow
through it. If the contract can't express the NFR, the contract is wrong now, not later. A comment
promising "no screen changes later" is a claim to test when you write it, not to trust.
