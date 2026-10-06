---
id: FL-023
date: 2026-10-02
author: Moha
related_interaction: A-015
what_went_wrong: The approved design said `BookingScreen` could keep `navigation.navigate('MyBookingsTab')` unchanged once the tab held a stack, "with nested params optional". The params were not optional, and even with them made optional, a booking would land on an older booking's details if the tab had been left there
how_caught: typecheck
fix: '`BookingScreen` navigates to `MyBookingsTab › MyBookingsList` with `pop: true`; two expectations in `BookingScreen.test.tsx` were updated on purpose and flagged in the PR'
---

# FL-023 — assumed tab navigate would still reach the list

## What went wrong

In [[A-015 booking details code and qr]], the design given to Moha for approval said:

> `BookingScreen` keeps `navigation.navigate('MyBookingsTab')`. With nested params optional this
> still opens the list; its existing tests (`BookingScreen.test.tsx:174`, `:213`) verify it.

Two claims, neither checked:

1. **"Nested params optional."** The design itself typed the tab as
   `NavigatorScreenParams<MyBookingsStackParamList>`, which is not optional. `tsc` rejected the call:
   `Argument of type 'string' is not assignable to parameter of type …`.
2. **"Still opens the list."** It does not, in one realistic case. The user opens a booking's
   details, switches to Cars and books another car. The Bookings stack still has the old details
   on top. A plain `navigate('MyBookingsTab')` shows that, not the list with the new booking.
   The existing tests could never have shown this: they mock `navigation` and only check the call.

The easy fix for (1), adding `| undefined` to the param type, would have made `tsc` green and
shipped (2).

## How it was caught

`tsc`, in the first full `npm run check`. Without it, Jest was green: the mocked `navigate`
accepted any arguments. The behavioural half (2) was caught only by thinking through why the type
had failed. No test or check would have found it.

## Fix

- `BookingScreen` now calls
  `navigation.navigate('MyBookingsTab', { screen: 'MyBookingsList', pop: true })`. In React
  Navigation 7, `navigate` no longer goes back to a screen already in the stack unless `pop: true`
  is passed. Checked in the installed `@react-navigation/core` 7 types, not from memory.
- Two expectations in `BookingScreen.test.tsx` change to that call. This is a deliberate behaviour
  change, stated in the PR, not a quiet test edit.

## Prevention

No new AGENTS.md rule: this is the existing lesson "check that a seam can carry every flow before
building on it" (FL-013) applied to navigation. When a design says "unchanged, still works", name
the check that showed it. Here, "its existing tests verify it" was a claim about tests that mock
the very thing in question.
