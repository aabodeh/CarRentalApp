---
id: FL-022
date: 2026-10-02
author: Moha
related_interaction: A-015
what_went_wrong: The agent wrote the agreed design to `docs/superpowers/specs/`, a location and format from an installed Claude Code plugin's default workflow, instead of the team's way of recording design (the prompt in `prompts/`, decisions in the `A-###` entry, the plan in the PR)
how_caught: code review
fix: Removed the spec folder in a follow-up commit (history kept as evidence); the design decisions moved into A-015, the conversation into P12
---

# FL-022 — design written to a foreign spec folder

## What went wrong

In [[A-015 booking details code and qr]], Claude Code ran a brainstorming workflow from an
installed plugin (`superpowers`). Its last step says to save the design to
`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, commit it, then write a separate plan
document. The agent did exactly that:

```
3b91dbe docs(spec): booking details with code and QR (part 1 of 3)
0a818ba docs(spec): add the error state to useBookingDetails
```

The repo has no spec folder and no such convention. Earlier sessions recorded design another way;
[[A-014 ux depth profile favourites filters]] is the latest example. The prompt went in
`docs/ai-log/prompts/`, the plan-stage decisions in the `A-###` entry, and the plan itself in the
PR. The agent had read AGENTS.md and the AI log index. It still followed the
tool's default over the team's practice without checking whether the two agreed.

It also skipped a log step. Six messages into a session that had already made design decisions,
there was no `P##` and no `A-###` yet.

## How it was caught

Moha, in the conversation: "Work the way we've always worked, saving the prompts, failures,
interactions… I haven't used specs." No check would have caught it. `npm run check` passed on both
commits, because a stray Markdown file breaks nothing. In review it would have surfaced as an
unexplained new top-level docs folder at best.

## Fix

- The spec folder is removed in a follow-up commit, not by rewriting the branch: the two commits
  stay as evidence of this entry.
- The decisions it held (scope split, "no code or QR until confirmed", code derived from the
  local id, own QR component over `react-native-qrcode-svg`) are in A-015. The conversation that
  produced them is [[P12]].
- No separate plan document. As before, the plan is agreed in the conversation and written into
  the PR.

## Prevention

A lesson in AGENTS.md: a tool's or plugin's default workflow does not override this repo's. When
a skill says where to write something, check first whether the repo already has a place for it.
