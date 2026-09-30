---
id: FL-019
date: 2026-09-30
author: Moha
related_interaction: A-012
what_went_wrong: The device test script in PR #9's description said that tapping "Try again" on a booking out of retries makes it "Confirmed, with the toast"; no toast is shown after a manual retry, because `resetForManualRetry` sets the attempt count back to 0 and the toast requires a success with more than one attempt
how_caught: test
fix: Corrected PR #9's description; the demo video script states the real behaviour; whether a manual retry should also show the toast is left to the team as a product decision
---

# FL-019 — device script promised a toast that never shows

## What went wrong

In [[A-012 retry queue my bookings and tabs]], Claude Code wrote a device test script into the
description of PR #9. Step 5 said:

> Turn the conditioner off and tap **Try again**: it becomes "Confirmed", with the toast.

That is not what the code does. `SyncToast` shows when a booking becomes `completed` with
`sync.attempts > 1`. "Try again" calls `resetForManualRetry`, which sets `attempts` back to 0, so
the successful send that follows is attempt 1. No notice is raised and no toast appears.

The AI described the behaviour it _expected_, in a script written for a human to follow on a
device. Moha would have waited for a toast that never comes, and might reasonably have concluded
that the app was broken.

## How it was caught

While writing the demo video script in [[A-013 hand-in preparation]], the AI had to work out how
to get the toast on camera, and noticed the reset. Instead of trusting the reasoning, it ran a
throwaway test: a booking with 4 failed attempts, a manual retry, and a successful send. Result:
`status=completed attempts=1 notice=no`.

Would anything else have caught it? Only Moha, on a device, by the toast not appearing. No test
covers "manual retry then toast", in either direction. The existing tests cover the toast after an
_automatic_ retry, and "Try again" confirming the booking, separately.

## Fix

- PR #9's description is corrected, with the date. Its commits were not touched.
- `docs/demo-video-script.md` states the real behaviour, in the shot where it matters.
- **Left open on purpose.** The current behaviour is defensible: the user who taps "Try again" is
  looking at the row, which changes to "Confirmed", and `SyncStatusBadge` announces the change to
  screen readers. But the prompt for PR 5 said "when a retry finally succeeds, the user must be
  told". If the team wants the toast after a manual retry too, it is a small change in
  `bookingReducer` or `resetForManualRetry` plus a test. It was not made here: this PR is
  documentation only, and it is a product decision.

## Prevention

- The AGENTS.md lesson "user-facing copy only promises what the app does" (FL-014) is widened to
  **test instructions**: a device script only states an outcome that a test or a run has shown.
- The device scripts in PR #9 and in the demo video script now mark what has not been rehearsed
  on a device.
