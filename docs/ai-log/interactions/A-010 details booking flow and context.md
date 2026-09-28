---
id: A-010
date: 2026-09-28
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: code
task: PR 3 — CarDetailsScreen with motion, BookingContext + bookingRepository (K3 seam), BookingScreen form with validation and live summary
prompt_or_link: '[[P7]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr:
---

# A-010 — details, booking flow and context

## Prompt

[[P7]], pasted verbatim into Claude Code. The branch was `feat/booking-flow`, from `main` after #4 and
#5 were merged. The prompt asked for:

- a details screen with an editorial layout, a pinned booking bar and scroll-driven motion
- `BookingContext` over a new in-memory `bookingRepository`, with `pending` → `completed` as the K3
  seam
- a booking form with a date-picker choice that has to be justified, live pricing, accessible
  validation, double-submit protection and keyboard handling
- Gherkin-named tests through the UI

It asked to start in plan mode and wait for approval.

## Output summary

**Plan-stage decisions**, approved with the plan:

1. **Dates use `@react-native-community/datetimepicker`.** It's included in Expo Go and uses the
   native picker on each platform. A typed text field, a hand-built calendar and a day stepper were
   all rejected, with reasons given. The plan quoted version 9.2.1, but `expo install` chose the
   SDK-compatible **9.1.0**.
2. **`@react-navigation/elements` is declared as a direct dependency**, for `useHeaderHeight()`,
   which the keyboard offset needs. It was already installed through native-stack.
3. **`bookingRepository` prices the booking itself** from the car's rate (never from the form),
   re-validates the input the way a server would, and saves it as `pending`. `syncBooking(id)` is
   the function the next PR replaces with the API call and the retry queue.
4. **The double-submit guard is a ref in the provider**, not only the disabled button. A second
   call while one is in flight returns the same promise.
5. **Field errors** are visible "Error: …" text, folded into the input's accessibility label (RN
   has no `aria-describedby`). A failed submit announces "N fields need attention" and moves focus
   to the first invalid text field.
6. **The form defaults** to today → tomorrow. The same-day rule appears as a permanent hint, plus a
   note whenever pick-up and return are the same day.
7. **Keyboard handling can't be tested in Jest.** The test guards the configuration (padding
   behaviour, header-height offset, `keyboardShouldPersistTaps`), and the real behaviour goes on
   the device list.

**Things the AI decided without being told:**

- A failed sync marks a booking `failed` instead of dropping it, which is the K2 spirit even before
  the queue exists.
- On the details screen, the make is the small label and the model the display name, with the full
  name as the accessibility heading.
- The not-found copy is "This car is no longer listed".
- The confirmation heading is "Booking received". The status words are "Saving…",
  "Couldn't save yet" and "Confirmed".
- The end-date picker's minimum is the pick-up date. Validation still covers the case where that
  is bypassed.

**Files.**

- `src/repositories/`: `bookingRepository.ts` (the `BookingRepository` type,
  `createInMemoryBookingRepository`, `InvalidBookingError`, `BookingNotFoundError`), and
  `simulatedLatency.ts`, which is now shared with `carRepository`.
- `src/context/BookingContext.tsx`: `bookingReducer`, `BookingProvider` and `useBookings`. The
  provider is mounted in `App.tsx`.
- `src/utils/`: `validateBooking`, `localDate`, `carLabels`.
- `src/hooks/useEntrance.ts`: the entrance animation, extracted from `CarCard`.
- `src/components/`:
  - `PrimaryButton`, extracted from `StateView`
  - `TextField`, `DateField`, `BookingSummary`, `SyncStatusBadge`, `SpecGrid`, `BottomActionBar`
  - `CarDetails`, `CarHero`, `AnimatedSection`, `FadingHeaderTitle`
  - `CarStateView`, `BookingForm`, `BookingConfirmation`
- `src/screens/`: `CarDetailsScreen` (43 lines) and `BookingScreen` (138 lines).
- `src/navigation/`: `Booking: { carId: string }`. The titles come from screen options, and the
  details title is set with `setOptions`.
- `src/theme/motion.ts`: the `hero` and `headerTitleFade` tokens.
- Docs: READMEs for repositories, context, components, hooks and utils. In AGENTS.md: testing rules
  for time and providers, and four new lessons.
- Tests: 29 suites, 208 tests (up from 133). That includes 7 details-screen tests and 13
  booking-screen tests, plus unit tests for the reducer, repository, context and utils.

**Problems during the session, as a factual record:**

- [[FL-008 npm install changed more than declared]]: an install meant only to declare
  `@react-navigation/elements` upgraded three navigation packages instead. It was redone with the
  exact version.
- [[FL-009 inline style objects despite the rule]]: the AI wrote inline styles twice. Lint doesn't
  check for them. A lint plugin is proposed for the team to decide on.
- [[FL-010 merged transforms cancelled the entrance animation]]: a refactor silently cancelled the
  card entrance animation while all tests passed.
- [[FL-011 deprecated datetimepicker onChange from memory]]: the AI used a deprecated API, which
  would have logged a warning on the device.
- **Test-code mistakes**, all caught by the tests themselves and fixed in the test, not the code:
  - In the context test, the rejection expectation was attached after timers were advanced, so the
    rejection counted as unhandled.
  - `runAllTimersAsync` looped forever on the skeleton's infinite pulse. It was replaced by explicit
    waits, and AGENTS.md now says so.
  - One test advanced time outside `act`, which printed an act warning. Fixed.
- **One test caught a real bug:** the repository stamped `createdAt` _after_ the simulated wait. It
  now records the submit moment.
- **A `TextField` test design question:** the visible label is deliberately hidden from screen
  readers (the input carries it, so it would be read twice). The test queries it with
  `includeHiddenElements` and a comment explaining why.
- **A caveat on the UI double-submit test:** it passes if _either_ guard works (the disabled
  button or the context ref). The context test isolates the ref, and the AI mutation-checked it:
  it fails without the guard. The first mutation run printed nothing, because a filtered
  non-verbose run doesn't list test names. It was re-run verbosely before being trusted.

**Verification the AI ran (AI verification, not human):**

- `npm run check` passed: lint with 0 warnings, prettier, `tsc`, 208/208 tests, and no console
  output.
- `expo-doctor` passed 21/21.
- `npx expo start` served the iOS and Android bundles with HTTP 200 and no Metro warnings.
- `expo export`: 3 font files and a 3 MB bundle, unchanged.
- The lockfile diff contains only the datepicker.
- A mutation check on the double-submit ref.

**Not verified by anyone yet (needs a device):**

- the date pickers on iOS (compact) and Android (dialog)
- whether the keyboard leaves "Confirm booking" reachable on both platforms (the Android behaviour
  under edge-to-edge is the open question)
- the hero stretch and zoom, section stagger, bar slide-up and header-title fade, all with reduce
  motion on and off
- the bottom bar clearing the home indicator, and the last spec staying above it
- 200% text in the summary, the bar and the spec grid
- VoiceOver/TalkBack reading the field errors, the "N fields need attention" announcement, the
  disabled book button's hint and the status change
- haptics on the primary buttons

## Evaluation

TODO (Moha): a human evaluation, after testing on a device. In particular: the picker choice, the
details layout (the make as the small label, the model as the display name), and whether the
accessible-error approach is good enough for the audit.

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. the Expo keyboard-handling guide, React
Navigation header docs, date-picker libraries, WCAG 3.3.1 on error identification), and whether it
agreed with the AI.
