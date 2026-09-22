---
id: A-007
date: 2026-09-22
author: Moha
tool: Claude Code (Claude Opus 5)
mode: agentic
area: docs
task: Backfill and reorder the AI dossier chronologically, with verbatim prompts
prompt_or_link: '[[P4]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/3
---

# A-007 — ai log backfill

## Prompt

[[P4]] — the backfill prompt, drafted in [[A-006 ai log backfill prompt]].

## Output summary

On branch `docs/ai-log-backfill`:

- **Deleted the two merged branches**, `chore/project-setup` and `chore/expo-sdk-patch`, locally and
  on the remote. They had survived PR merge because `delete_branch_on_merge` was enabled after both
  PRs landed.
- **Renumbered the dossier chronologically.** The one existing entry moved from `A-001` to `A-003`
  with `git mv`, so its history survives. Six new interaction entries were written around it.
- **Stored the prompts verbatim** in `docs/ai-log/prompts/` as [[P1]], [[P2]], [[P3]] and [[P4]],
  linked from the entries that produced and consumed them.
- **Wrote three failure entries**, [[FL-001 stale react native animated mock]],
  [[FL-002 wrong area for setup log entry]] and
  [[FL-003 expo install dev flag puts packages in dependencies]], meeting the course minimum of three.
- **Fixed the `npx expo install` instruction** in `AGENTS.md` and `CONTRIBUTING.md`, and added the
  first entry to the "Lessons learned / known agent mistakes" section of `AGENTS.md` — see FL-003.
- **Rewrote the index** in `docs/ai-log/README.md`.
- **Updated PR #2's description** with `gh pr edit`, changing its `A-003` reference to `A-005` to
  match the new numbering.

### P1 and P3 were recovered, not pasted

[[P4]] shipped with `[PASTE P1 HERE]` and `[PASTE P3 HERE]` left unfilled. Both prompts were
recovered verbatim from the Claude Code session transcripts, where each appears as the original user
message that opened its session. This is the only place the backfill drew on a source other than the
text of P4, and it is recorded in [[P4]] as well so the substitution is auditable.

### FL-003 was reproduced before being written

As [[P4]] required. Two throwaway installs of `expo-constants`, each reverted with `git checkout`:

| Command                                                               | Where the package landed |
| --------------------------------------------------------------------- | ------------------------ |
| `npx expo install expo-constants -- --save-dev` (what AGENTS.md said) | `dependencies` ❌        |
| `npx expo install expo-constants --dev` (what the Expo docs say)      | `devDependencies` ✅     |

Confirmed, so FL-003 was written and the instruction fixed in both files.

## Evaluation

TODO (Moha)

## Alternatives considered without AI

TODO (Moha)
