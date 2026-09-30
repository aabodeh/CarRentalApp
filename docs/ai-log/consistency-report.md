# AI dossier — consistency report

Checked on 2026-09-30, on branch `chore/handin-prep`. **This is a report, not a repair.** No
existing `A-###` or `FL-###` entry was edited. The only changes to the dossier in this pull request
are the entries for the task itself (A-013, FL-017 to FL-019, P10) and their rows in the index.

Re-run it at any time, from the repository root:

```
python3 scripts/check-dossier.py
```

The script only reads. Re-run it after filling in the open fields below: the "TODO by entry" list
should then be empty.

## Result

| Check                                                           | Result                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Interaction entries numbered without gaps                       | ✅ A-001 to A-013, 13 files                                    |
| Failure entries numbered without gaps                           | ✅ FL-001 to FL-019, 19 files                                  |
| `id` in each file's frontmatter matches its filename            | ✅ all 32                                                      |
| Entries are in date order                                       | ✅ both series                                                 |
| Every failure names an interaction that exists                  | ✅ all 19                                                      |
| Every prompt file that is referenced exists                     | ✅ P1 to P10; none missing, none unreferenced                  |
| Every `[[wikilink]]` in `docs/` resolves                        | ✅                                                             |
| The README index lists exactly the files on disk, in order      | ✅ 13 of 13 and 19 of 19                                       |
| Index PR links agree with each entry's `related_pr`             | ✅ where both exist (see finding 2)                            |
| Graded fields use allowed values (`area`, `mode`, `how_caught`) | ✅ all 32                                                      |
| Entry counts quoted elsewhere match the files                   | ✅ (see "Counts" below)                                        |
| Every interaction is linked to a pull request                   | ⚠️ 2 are not, and PR #8 is linked from none (findings 2 and 3) |
| Human fields agree with GitHub's records                        | ⚠️ 1 does not (finding 1)                                      |

## Findings that need you

### 1. A-003's `verification` says PR #1 was reviewed; GitHub has no review on PR #1

- A-003, `verification`: _"Reviewed and approved by a teammate before merge; CI passed. (Provided
  by Moha.)"_
- `gh pr view 1 --json reviews,mergedBy`: **no reviews**; merged by `aabodeh`. The author is
  `moha-ech`.

Both can be true: a teammate may have reviewed it in person and then merged it, without pressing
"Approve". But as written, the entry says something GitHub doesn't show, and
`docs/development-report-notes.md` states that PR #1 has no recorded review. A grader comparing the
two will see a contradiction. **Only you know what happened.** Either reword the field to say how
the review was done ("reviewed in person by …, who then merged it; no GitHub review recorded"), or
correct it.

### 2. Two interactions have no pull request

A-001 and A-006 have an empty `related_pr`. Both are chat sessions that drafted a prompt (P1 and
P4). Their output reached the repository through the entries that used those prompts: A-003
(PR #1) and A-007 (PR #3). If the rule is "every entry is linked to its PR", decide whether these
two should point at those PRs or say explicitly that they have none.

Also, A-002 and A-004 have a `related_pr` (PR #1), but their rows in the README index show no PR
link. That's not a contradiction, only an omission in the index.

### 3. PR #8 is not the `related_pr` of any entry

PR #8 (the MockAPI seed fix) was part of the A-011 session. A-011 describes it in its body, and
PR #8's description cites A-011 and FL-015, but A-011's `related_pr` lists only PR #7. If each PR
should be findable from the dossier, add PR #8 to A-011's `related_pr`.

### 4. Nine failures say `how_caught: code review`, and in all nine the reviewer was an AI

`grep -l '^how_caught: code review' docs/ai-log/failures/*` finds nine entries. Reading each
"How it was caught" section:

- **FL-002:** Claude chat reviewing Claude Code's plan (A-002).
- **FL-005, FL-009, FL-010, FL-011, FL-013, FL-014, FL-016, FL-018:** the AI rereading its own
  work, or its own plan.

None was caught by a human reviewing code. The README's own rule is that one AI checking AI output
is not human verification. The enum has no value for it, so "code review" was the closest fit, and
each entry's body does say who caught it. If `how_caught` is graded as written, consider adding a
value such as `AI review`, or a line in the README saying that `code review` includes it.

### 5. Commit hashes in ten failure notes point at commits that are not on `main`

FL-004 to FL-014 cite commits by hash. Ten of the eleven hashes belong to branches that were
**squash-merged** and deleted, so `git log main` will not find them:

| Hash      | Cited in       | Where it lives                                          |
| --------- | -------------- | ------------------------------------------------------- |
| `dad51b1` | FL-004         | PR #4 (FL-004 also gives `a343582`, which is on `main`) |
| `4892471` | FL-005, FL-006 | PR #5                                                   |
| `7373f3d` | FL-007         | PR #5                                                   |
| `42f5623` | FL-008         | PR #6                                                   |
| `1cd30d3` | FL-009         | PR #6                                                   |
| `0d60102` | FL-009         | PR #6                                                   |
| `c5bebbb` | FL-010         | PR #6                                                   |
| `c95c801` | FL-011         | PR #6                                                   |
| `c1527ab` | FL-013         | PR #7                                                   |
| `0d2179a` | FL-014         | PR #7                                                   |

They are **not dead**: each still resolves on GitHub (`gh api repos/aabodeh/CarRentalApp/commits/<hash>`,
checked for all ten), because GitHub keeps the commits of a merged pull request. Nothing needs
fixing unless you want every reference to work from a plain clone of `main`. In that case, name
the PR next to each hash.

### 6. Four entries are missing their prompt link

A-001, A-002, A-004 and A-006 have `prompt_or_link: 'TODO (Moha): shared chat link'`. These are the
claude.ai chat sessions; only you have the share links.

## What you still owe: every open field, by entry

54 open items in 13 entries. [`python3 scripts/check-dossier.py`, last section]

| Entry | `prompt_or_link` | `verification` | `decision` | Evaluation | Alternatives considered without AI |
| ----- | :--------------: | :------------: | :--------: | :--------: | :--------------------------------: |
| A-001 |       TODO       |      TODO      |    TODO    |    TODO    |                TODO                |
| A-002 |       TODO       |      TODO      |    TODO    |    TODO    |                TODO                |
| A-003 |        —         |    filled¹     |   filled   |  partly²   |                TODO                |
| A-004 |       TODO       |      TODO      |    TODO    |    TODO    |                TODO                |
| A-005 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-006 |       TODO       |      TODO      |    TODO    |    TODO    |                TODO                |
| A-007 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-008 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-009 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-010 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-011 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-012 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |
| A-013 |        —         |      TODO      |    TODO    |    TODO    |                TODO                |

¹ See finding 1. ² A-003's Evaluation has content and ends "Anything beyond the above: TODO (Moha)."

In short: **12 `verification` fields, 12 `decision` fields, 4 chat links, 13 Evaluation sections
(one half-written) and 13 Alternatives sections.** The failure entries (FL-###) have no open
fields.

`verification` and `decision` describe what a human did. No AI may fill them in.

## Counts

Counted from the files, after this task's entries were added. [`ls docs/ai-log/<folder> | wc -l`]

| Folder          | Files | Range            |
| --------------- | ----- | ---------------- |
| `interactions/` | 13    | A-001 to A-013   |
| `failures/`     | 19    | FL-001 to FL-019 |
| `prompts/`      | 10    | P1 to P10        |

Places that quote a count, and whether they agree:

- `docs/development-report-notes.md` §8: states 13 and 19, filled in from the command above. ✅
- `docs/ai-log/README.md`: quotes no totals. Its sentence of dates ("A-001 to A-007 are from
  2026-09-22; …") matches the files. ✅
- `AGENTS.md`, `CONTRIBUTING.md`, `docs/ai-log/README.md`: "at least three failure entries" is the
  course's minimum, not a count of ours. ✅
- FL-016 quotes "12 … and 16 …" as the wrong numbers it is about. ✅

## What was not checked

- Whether what each entry _says happened_ is true. The check covers structure: numbering, links,
  counts, allowed values. It doesn't cover content, except where GitHub could confirm or
  contradict it (finding 1).
- The four claude.ai chat sessions (A-001, A-002, A-004, A-006): there is no transcript in the
  repository to compare them with.
