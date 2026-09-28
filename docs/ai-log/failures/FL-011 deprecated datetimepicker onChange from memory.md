---
id: FL-011
date: 2026-09-28
author: Moha
related_interaction: A-010
what_went_wrong: Wrote DateField against `onChange(event, date)` of @react-native-community/datetimepicker, which is deprecated in the installed 9.1.0 and logs "DateTimePicker `onChange` is deprecated" as a console.warn in development
how_caught: code review
fix: Switched both the iOS component and Android's DateTimePickerAndroid.open to `onValueChange(event, date)`, which fires only when a date is picked
---

# FL-011 — deprecated datetimepicker onChange from memory

## What went wrong

During [[A-010 details booking flow and context]], Claude Code wrote `DateField` using the
datetimepicker API it remembered:

```tsx
const handleChange = (event: DateTimePickerEvent, date?: Date) => {
  if (event.type === 'set' && date) onChange(toLocalIsoDate(date));
};
<DateTimePicker onChange={handleChange} … />
```

In the installed version, 9.1.0, `onChange` still works, but it is deprecated.
`warnIfOnChangeIsUsed` logs this in development:

> DateTimePicker: `onChange` is deprecated. Use `onValueChange`, `onDismiss`, and
> `onNeutralButtonPress` instead.

The prompt's finish line was "`npx expo start` clean". That warning would have appeared the first
time anyone opened the booking form.

This is the same class of mistake as [[FL-006 reanimated value assignment rejected by compiler lint]]:
an API remembered from an older version. That's the second time in two sessions.

## How it was caught

Before writing the screen tests, the AI read the library's `datetimepicker.ios.js` to learn how
its host element reports a change, and found the deprecation check there.

Would anything else have caught it? **Probably, but only by eye.** The tests render the picker, so
Jest would have printed the `console.warn`, which a person has to notice in the output. Metro's
bundle step doesn't run code, so it wouldn't show at `expo start` until the screen opened on a
device. And `npm run check` passes with console warnings.

## Fix

`DateField` now uses `onValueChange(event, date)` for both the iOS component and
`DateTimePickerAndroid.open`, where `date` is always defined. The old `event.type === 'set'` check
is gone, because `onValueChange` only fires when a date is actually picked. Commit `c95c801`.

## Prevention

- A new AGENTS.md "Lessons learned" entry, now that this has happened twice (FL-006 and FL-011):
  before using a library API from memory, open the **installed** version's types or source and
  check that it isn't deprecated.
- Worth considering: make the Jest setup fail any test that logs a `console.warn` or
  `console.error`, so "noticing" stops being the safety net. That changes every suite, so the team
  should decide. Not done here.
