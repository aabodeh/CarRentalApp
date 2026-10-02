---
id: A-015
date: 2026-10-02
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: Part 1 of 3 — a booking details screen reached from My bookings, showing a booking code and a QR once the booking is confirmed; parts 2 (cancel) and 3 (modify) split off as deferred work
prompt_or_link: '[[P12]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr:
---

# A-015 — Booking details with code and QR

## Prompt

[[P12]]: a conversation in Spanish, logged as an English translation. Moha asked for a QR and a
code on every booking, a details view inside My bookings, and modify and cancel. Moha also asked
what happens if the connection drops right as a booking is made.

## Output summary

**The connectivity question**, answered from the code, with nothing changed:

- the booking is saved on the phone first, as `pending`;
- no attempts are made while offline;
- a drop in the middle of a send counts as a failed attempt, retried after 2 s, 8 s and 30 s;
- each retry first checks `clientBookingId` on the server, so a send that did arrive is not
  duplicated;
- after 4 attempts the user sees "Try again";
- known gap (deferred on purpose): no retries while the app is closed.

**Plan-stage findings and decisions**, each answered by Moha:

1. **Scope split.** Modify and cancel are on AGENTS.md's "Deferred, on purpose" list, and
   `syncPolicy.ts` assumes the server never changes a booking after creation. Doing them means new
   K2 rules (queued cancels and edits, cancelling an unsent booking). It also means storing the
   server's id, which the app does not keep and needs for `PUT`/`DELETE`. The AI proposed:
   - part 1: details, code and QR;
   - part 2: cancel;
   - part 3: modify.

   Moha chose part 1 now. Un-deferring parts 2 and 3 is a team decision.

2. **Unconfirmed bookings.** Moha chose: no code and no QR until the booking is `completed`. The
   screen says it is not confirmed yet. A pass for a booking the server does not have would promise
   something untrue (FL-014).
3. **Where the code comes from.** Moha chose to derive it from the existing local id, which is
   already sent as `clientBookingId`: `booking-mg8xk2lq-1` → `MG8XK2LQ-1`. The QR encodes the exact
   id. This leaves `Booking`, the class diagram, `STORAGE_VERSION` and the retry queue untouched.
   Rejected:
   - the server's id: MockAPI numbers bookings 1, 2, 3, and storing it needs a migration; it
     belongs in part 2;
   - a new random field: a `STORAGE_VERSION` bump without a migration would wipe saved bookings.
4. **Navigation and screens** (approved):
   - My bookings gets its own native stack: `MyBookingsList` → `BookingDetails { bookingId }`.
   - The details screen reads the booking from `BookingContext`, so it updates live.
   - The row's content is pressable. "Try again" stays outside the pressable area, so it is not a
     button inside a button.
   - Flagged ahead of time (FL-020): `MyBookingsScreen.test.tsx:104` pins the row titles as the
     only headers, and will not be edited quietly if it breaks.
5. **Code display and QR** (approved):
   - the code is spelled character by character for screen readers;
   - the QR is always dark on light, on a quiet zone, also in dark mode, with new theme tokens and
     a contrast-test row;
   - dependencies: `react-native-svg` (Expo SDK 57's bundled 15.15.4) and `qrcode-generator`, plus
     a small QR component of our own. Chosen over `react-native-qrcode-svg`, which pulls in an
     unmaintained `text-encoding` polyfill.

**Errors made and caught in the session:**

- [[FL-022 design written to a foreign spec folder]]: the design was committed to
  `docs/superpowers/specs/`, a plugin's default location, not the team's. Moha caught it. The
  folder is removed in a follow-up commit; the decisions above replace it.
- Smaller, caught by the AI's own reread before review: the written design said a load error
  maps to an error state, but the hook's union had no `error` member. It was fixed in `0a818ba`,
  before that file was removed.

**Implementation:** not started at the time of writing. This entry will be extended with what was
built.

## Evaluation

TODO (Moha): how well this went, and what had to be changed by hand. Only a human can judge this.

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (QR libraries for Expo, React Navigation's
nested navigators, how other rental apps show a pick-up pass, …) and whether it agreed. Leave
"none" only if that is true.
