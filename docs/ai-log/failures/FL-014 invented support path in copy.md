---
id: FL-014
date: 2026-09-29
author: Moha
related_interaction: A-011
what_went_wrong: Wrote the failed-booking message "Saved on this phone, but our server turned it down. Please contact us." — the app has no contact channel, so the copy sent users to a support path that does not exist
how_caught: code review
fix: Copy now states only the fact ("Saved on this phone, but our server didn’t accept it."); what the user can do about a failed booking is a product decision for PR 5
---

# FL-014 — invented support path in copy

## What went wrong

While adding offline-aware messages to `BookingConfirmation` in
[[A-011 api offline cache and banner]], Claude Code wrote this for a booking that the server
rejects:

> Saved on this phone, but our server turned it down. Please contact us.

There is no "us" to contact. The app has no email address, phone number, help screen or support
flow. The copy promised the user a way out that doesn't exist, which is worse than saying nothing.
It's also the same kind of invention the plan for PR #5 had explicitly avoided, where the AI
declined to make up a reason why a car is unavailable.

## How it was caught

The AI caught it on self-review, rereading its own copy after the tests went green and before
committing.

Would anything else have caught it? **No.** No test asserts on that sentence, lint doesn't read
prose, and a reviewer would likely skim it as plausible filler. It would have shipped.

## Fix

The copy now states only the fact: "Saved on this phone, but our server didn’t accept it." It's
in commit `0d2179a`, the offline surface commit on this branch. What the user _should_ be able to do
about a rejected booking (retry, edit, cancel) is a product decision. It belongs with PR 5's retry
work and in the design document, not in a sentence an AI made up.

## Prevention

A new AGENTS.md "Lessons learned" entry: user-facing copy may only promise what the app actually
does. No "contact us", "we'll email you" or "try again later" unless that path exists and is tested.
