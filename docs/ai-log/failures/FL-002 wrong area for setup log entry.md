---
id: FL-002
date: 2026-09-22
author: Moha
related_interaction: A-002, A-003
what_went_wrong: Claude Code's plan classified the setup log entry under area "structure", which is the design-doc plane (navigation and data model), not tooling
how_caught: code review
fix: Changed to "code" before execution, as part of the four plan-review changes in P2.
---

# FL-002 — wrong area for setup log entry

## What went wrong

The setup plan produced in [[A-003 project setup scaffolding]] proposed writing the session's own AI
log entry with `area: structure`.

`area` comes from the course's Appendix A vocabulary — `strategy / scope / structure / skeleton /
surface / code / tests / docs`. In that vocabulary `structure` refers to the design plane: the
navigation model and the data model. The session in question produced lint configuration, npm
scripts, a Jest preset, a CI workflow and folder READMEs. That is `code` — tooling and
infrastructure.

Miscategorising it is not cosmetic. `area` is how the dossier will be read and grouped at hand-in, so
a tooling session filed under the design plane misrepresents where the AI was actually used, in a
document whose whole purpose is accurate disclosure.

## How it was caught

Plan review, before any code was written. Claude Code was asked to start in plan mode and wait; the
plan was pasted into Claude chat in [[A-002 setup plan review]], which flagged the `area` value among
four proposed changes. Moha confirmed it and sent [[P2]].

Would it have been caught without that check? Probably not for a long time. Nothing validates the
`area` field — not the linter, not CI, not the slash command. It would have sat in the dossier
unchallenged until someone read the entries closely against the Appendix A definitions, most likely
at hand-in. The plan-review step was the only thing standing between the mistake and the report.

## Fix

Changed to `area: code` before execution, as item 4 of [[P2]]. The entry — now
[[A-003 project setup scaffolding]] after the chronological renumbering — carries `area: code`.

## Prevention

The `/log-ai` command now spells out the distinction in its instructions rather than leaving the
agent to guess from the bare list of values: tooling and infrastructure count as `code`, while
`structure` is reserved for design-document work.

The broader lesson, added to "Lessons learned / known agent mistakes" in `AGENTS.md`: an agent
filling in a metadata field from a list of allowed values will pick a plausible-sounding one. Fields
that are graded deserve a definition next to them, not just an enum.
