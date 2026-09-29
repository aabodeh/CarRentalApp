---
id: FL-016
date: 2026-09-29
author: Moha
related_interaction: A-012
what_went_wrong: Wrote "12 interaction entries (A-001 to A-012) and 16 failure entries (FL-001 to FL-016)" into docs/development-report-notes.md — a document whose first line says every number was read from the repository — when the repository held 11 and 15; the counts were predicted, not counted
how_caught: code review
fix: The counts in the notes are now filled in by counting the files after all of this PR's log entries exist, and the section says how they were counted
---

# FL-016 — report notes stated counts not yet true

## What went wrong

The PR 5 prompt ([[P9]]) asked for `docs/development-report-notes.md`: "Facts only, no polish". Its
first line, written by Claude Code, promises: _"Every number here was read from the repository,
`gh`, or a test run."_

Section 7 then said:

> 12 interaction entries (A-001 to A-012) and 16 failure entries (FL-001 to FL-016 …)

At that moment `docs/ai-log/interactions/` held **11** files and `failures/` held **15**. A-012
(this PR's entry) and FL-016 didn't exist yet. The AI wrote down what it _expected_ the counts to
be once this PR was logged, and presented that as a fact counted from the repo. Those notes are the
source for a graded report, so a wrong number there could go straight into the hand-in.

It's the same failure as [[FL-015 assumed mockapi adds ids to seed]], one session later: a
confident statement that nobody had checked.

## How it was caught

The AI caught it on self-review, rereading the notes before committing. It compared section 7
against the `ls docs/ai-log/*` counts it had printed a few minutes earlier (11 and 15).

Would anything else have caught it? **Probably not before the report was written.** No test
checks prose, and a reviewer would have no reason to recount the log folders. In a few days it
would even have _become_ true, as more entries were added, which would have hidden that it was
written as a guess.

## Fix

- The counts in section 7 are filled in last, by counting the files after A-012 and this note
  exist, with the command stated next to them.
- Section 1 of the notes already cites a source for each number. Section 7 now does too.

## Prevention

- The AGENTS.md lesson from FL-015 ("…not a fact until you have seen it") is widened to cover
  numbers in documents: **a number goes into a document only after it has been counted, with the
  command that counted it.**
- No new tooling: a prose check isn't worth building for this.
