---
id: A-006
date: 2026-09-22
author: Moha
tool: Claude (claude.ai chat, Claude Opus 5)
mode: chat
area: docs
task: Draft the AI dossier backfill prompt
prompt_or_link: 'TODO (Moha): shared chat link'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr:
---

# A-006 — ai log backfill prompt

## Prompt

From Moha to Claude chat, verbatim:

"Vale ya ha acabado, vamos con los logs y failures, dame el prompt para que ordene todo en orden cronologico y ponga tal cual los prompts, incluye los tuyos del chat que te he puesto, ponlos todos en el prompt para que reordene"

## Output summary

The backfill prompt, stored here as [[P4]], which became the input to [[A-007 ai log backfill]].

It specified: chronological renumbering to A-001…A-007 and FL-001…FL-003; verbatim prompt copying
with no translation or tidying; `git mv` for the existing entry so history survives; dates and PR
numbers taken from `git log` and `gh pr list` rather than assumed; the rule that `verification`,
`decision`, _Evaluation_ and _Alternatives considered without AI_ are human fields and stay
`TODO (Moha)` unless supplied; and the rule that an AI checking AI output must be labelled **AI
verification**, never human verification.

It also carried the human-supplied facts for [[A-003 project setup scaffolding]] (decision:
modified; teammate review and passing CI as verification), and instructed that FL-003 be
**reproduced before being written**, or reported as not reproducible.

## Evaluation

TODO (Moha)

## Alternatives considered without AI

TODO (Moha)
