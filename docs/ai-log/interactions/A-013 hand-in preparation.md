---
id: A-013
date: 2026-09-30
author: Moha
tool: Claude Code (Claude Opus 5.5)
mode: agentic
area: docs
task: PR 6 — hand-in material: README for a first-time reader, requirements-to-evidence table, development report notes, AI dossier consistency pass, demo video script
prompt_or_link: '[[P10]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/10
---

# A-013 — hand-in preparation

## Prompt

[[P10]], pasted verbatim into Claude Code. The branch was `chore/handin-prep`, from
`feat/sync-and-bookings` (PR #9, open and unreviewed), with the PR to be opened against that
branch. The prompt said no new features, only documentation and hand-in material. It asked to
start in plan mode and wait for approval.

## Output summary

**Plan-stage flags**, approved with the plan:

1. **Screenshots were possible, within limits.** This Mac has Xcode simulators. The plan was to
   run the app in Expo Go on the iPhone 17 simulator against the live API, and to try simulated
   taps through AppleScript. No code would be added to the app just to take pictures, and no
   booking would be confirmed.
2. **The branch-protection date could not be read.** The account has `push`, not `admin`. The
   plan was to state what the log records (2026-09-22, after PR #2) and what cannot be confirmed.
3. **The dossier pass reports only.** No existing `A-###` or `FL-###` entry was edited. The only
   additions to the dossier are this task's own entries and index rows.
4. **The project case document was not available.** The requirements list in the prompt was used.

**Files.**

- `README.md`: rewritten. It covers what the app is, the course context, four screenshots, how to
  run it, the API, the checks, a map of the repo and documents, and what was left out. The stale
  "Status" section and the web instructions (which no longer work) were removed.
- `docs/screenshots/`: four PNGs of the list, details, booking form and My bookings (empty). They
  come from Expo Go on the iPhone 17 simulator, against the live MockAPI, resized to 603×1311.
- `docs/requirements-coverage.md`: F1–F5 and K1–K3. Each has the implementing files, the tests
  that prove it, what was deferred, and a section on what no automated test can prove.
- `__tests__/docs/requirementsCoverage.test.ts`: fails if that page cites a missing file, a test
  that is not in the file it names, or a count that doesn't match its own list.
- `docs/development-report-notes.md`: rewritten and extended (conventions and enforcement, the
  seam with the measured diff, patterns, tests by layer, the debugging narrative, the process
  section, AI use, deferred items).
- `docs/demo-video-script.md`: seven shots, about 3:30, with an attempt-by-attempt timeline for
  the retry shot and a fallback.
- `docs/ai-log/consistency-report.md`: the result of the dossier pass, with the command behind
  each check.
- AGENTS.md: two lessons (FL-017, FL-018/FL-019).
- No file under `src/` was changed.

**What running the app for the first time showed.** The simulator session was the first time the
app ran outside Jest. It loaded the 10 cars from the real API, the data-age label ticked from
"just now" to "1 minute ago", and the details, the booking form (with native date pickers) and My
bookings all rendered. Metro logged **no warnings**. Three visual issues were seen. None was
fixed, because this PR is documentation only:

- In the list, the price reads "349 kr ." with a gap before the full stop. This is most likely
  the `tabular-nums` setting on the `price` text style; the details screen, which uses another
  style, shows "349 kr." correctly.
- The details screen's "Book this car" bar has empty space under the button. It adds the
  home-indicator inset, but since PR #9 there is a tab bar below it that already covers that area.
- The tab labels sit at the top of the tab bar, with empty space below them.

**Findings that contradicted what was assumed:**

- **PR #8 was merged as a merge commit, by its author** (with a teammate's approval). A-005
  recorded the repository as squash-only on 2026-09-22. Today `allow_merge_commit` is `true`. So
  the merge method cannot be used to date the branch protection, as the plan had intended. The
  notes state only what the log records.
- **The draft report notes said every PR was reviewed.** `gh` shows #1 and #2 have no recorded
  review. (This was already corrected in A-012; the process section now has the full table.)
- **Ten of the eleven commit hashes cited in failure notes are not on `main`.** They belong to
  branches that were squash-merged. They still resolve on GitHub through their pull requests.
- **A manual "Try again" does not show the toast**, contrary to PR #9's device script. See
  [[FL-019 device script promised a toast that never shows]].

**Problems during the session, as a factual record:**

- [[FL-017 committed before reading the check]]: a commit was chained with `;` after a failing
  `tsc`. It was amended before push.
- [[FL-018 report notes cited an uncounted line total]]: "10 lines out of 1,059"; the real total
  was 298.
- [[FL-019 device script promised a toast that never shows]]: found while writing the video
  script, and confirmed with a throwaway test.
- **The demo script's retry shot was wrong at first.** It said the toast appears as soon as you
  return to the app. In fact an attempt already in flight has to time out first (up to 8 s), and
  all four attempts are used up 72 s after confirming. Both are now in the script, with a
  timeline.
- **A requirement-table evidence line didn't prove its requirement**: a colour-contrast test
  listed under K3. It was removed before commit.
- **The summary counts in the requirements table were first typed by hand.** The test now checks
  them against the lists.
- **A simulated tap missed once**, on the tab bar, and looked like an app bug. Three more taps at
  the same height switched tabs every time, so it was the simulated click, not the app. It was not
  reported as a bug.

**Verification the AI ran (AI verification, not human):**

- `npm run check` passed: lint with 0 warnings, prettier, `tsc`, and 359/359 tests in 46 suites.
- The requirements-table test was mutation-checked with a wrong test title, a wrong path and a
  wrong count: three failures, one per check.
- 36 relative links and anchors in the hand-in documents were checked by script.
- The app was run in the iPhone 17 simulator against the live API: four screens, no Metro
  warnings.

**Not verified by anyone yet:**

- everything in the demo video script: no shot has been rehearsed on a device
- the offline and retry states on a device
- the exact time branch protection was enabled (only the repository owner can read it)

## Evaluation

TODO (Moha): a human evaluation. In particular: are the report notes enough to write the report
from without opening the repo, and does the video script work when filmed?

## Alternatives considered without AI

TODO (Moha): what the team looked up independently (e.g. how other groups present requirement
coverage, the course's report template, screen-recording tools), and whether it agreed with the AI.
