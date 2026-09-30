---
id: FL-018
date: 2026-09-30
author: Moha
related_interaction: A-013
what_went_wrong: Wrote "The screens changed by 10 lines out of 1,059" into docs/development-report-notes.md; the 10 was measured with git, the 1,059 was never counted — the screens totalled 298 lines at that commit
how_caught: code review
fix: Counted with `git show 930f3c0:<file> | wc -l` (298 lines in src/screens, 3,169 in src/) and rewrote the sentence with both figures and the command
---

# FL-018 — report notes cited an uncounted line total

## What went wrong

The strongest claim in the development report notes is how little the screens changed when dummy
data became a real API. While writing it in [[A-013 hand-in preparation]], Claude Code measured the
change properly, with `git diff --shortstat 930f3c0 c1331f6 -- src/screens`: 9 lines added, 1
removed. Then it wrote:

> The screens changed by 10 lines out of 1,059.

**Nobody counted the 1,059.** It was a plausible-looking number produced while writing the
sentence. The real total was 298 lines.

This is [[FL-016 report notes stated counts not yet true]] again, one day later, in the same
document, with the AGENTS.md lesson from FL-016 ("a number goes into a document only after it has
been counted") already in place. The lesson did not prevent it.

## How it was caught

The AI caught it on self-review, right after writing the file: it reread the new text looking for
any number it could not point to a command for, and this was the one. It is AI self-review, not
human review.

Would anything else have caught it? **No.** Nothing checks prose. And this number mattered: it
is the denominator of the report's main architectural claim. "10 of 1,059" and "10 of 298" are
both small, so the conclusion holds either way, but a grader who recounted would have found a
made-up figure in a document that promises none.

## Fix

The sentence now reads: 10 lines (9 added, 1 removed), in files that totalled **298** lines at
PR #6, with `src/` at 3,169 lines, and the `git show … | wc -l` command next to it.

## Prevention

- The rule exists already, and a rule was not enough. What worked was the _pass_: after writing
  any document with numbers, reread it once looking only at the numbers, and for each one name the
  command that produced it. AGENTS.md now says to do that pass, not only to follow the rule.
- The requirements table shows the mechanical alternative: its counts are checked by a test
  (`__tests__/docs/requirementsCoverage.test.ts`). The report notes are not, because most of their
  numbers come from git history and `gh`, which a unit test can't read.
