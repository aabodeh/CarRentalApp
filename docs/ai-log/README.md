# AI log

The course requires every significant AI interaction to be disclosed and logged. This folder is
that log, kept as notes in git so its history is reviewable.

## Workflow

1. Did AI produce or change something that ended up in the repo? Then it needs an entry.
2. Run `/log-ai` in Claude Code, or copy `docs/templates/ai-interaction.md` by hand.
3. Name the note `A-### short title.md` in `interactions/`, taking the next free number.
4. Fill in `verification` and `decision` **yourself** — an AI must never write those two.
5. If the AI got something wrong, add an `FL-### short title.md` in `failures/` (`/log-failure`).
6. Put the `A-###` ID in the pull request description. The PR template asks for it.
7. Add the note's line to the index below. The slash commands do this for you.

`verification` means what a human actually did: ran the tests, read the diff, tried it on a
device. "It ran" is not verification. `decision` is `kept`, `modified` or `discarded`.

**One AI checking another AI's output is not human verification.** It is useful, and it belongs in
the entry — but label it _AI verification_ and keep it out of the `verification` field.

**The course requires at least three failure entries.** Write them when they happen — a log
reconstructed the night before the deadline reads exactly like one reconstructed the night
before the deadline.

## Index — interactions

Chronological. Every entry is from 2026-09-22.

| ID                                                | Tool        | Mode    | Area | What                                                                                                          |
| ------------------------------------------------- | ----------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| [[A-001 course context and initial setup prompt]] | Claude chat | chat    | docs | Course context from the Drive materials, repo review, drafting the setup prompt [[P1]]                        |
| [[A-002 setup plan review]]                       | Claude chat | chat    | code | Reviewing Claude Code's setup plan before execution; produced [[P2]]                                          |
| [[A-003 project setup scaffolding]]               | Claude Code | agentic | code | Tooling, folder skeleton, AGENTS.md, this vault, CI ([PR #1](https://github.com/aabodeh/CarRentalApp/pull/1)) |
| [[A-004 setup review and repo config prompt]]     | Claude chat | chat    | code | Reviewing the setup result; drafting [[P3]]                                                                   |
| [[A-005 repo configuration and expo patch]]       | Claude Code | agentic | code | CI check, branch protection handoff, expo patch ([PR #2](https://github.com/aabodeh/CarRentalApp/pull/2))     |
| [[A-006 ai log backfill prompt]]                  | Claude chat | chat    | docs | Drafting the backfill prompt [[P4]]                                                                           |
| [[A-007 ai log backfill]]                         | Claude Code | agentic | docs | This chronological backfill ([PR #3](https://github.com/aabodeh/CarRentalApp/pull/3))                         |

## Index — failures

| ID                                                             | From         | What went wrong                                                        | Caught by                        |
| -------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- | -------------------------------- |
| [[FL-001 stale react native animated mock]]                    | A-003        | Mocked a React Native module path that does not exist in 0.86          | The test suite failed to run     |
| [[FL-002 wrong area for setup log entry]]                      | A-002, A-003 | Filed a tooling session under `area: structure`                        | Plan review, before execution    |
| [[FL-003 expo install dev flag puts packages in dependencies]] | A-003        | Wrote a broken `npx expo install` flag into AGENTS.md as the team rule | Manual reproduction during A-007 |

Three entries, which is the course minimum. Add more as they happen.

## Prompts

Long prompts live in `prompts/` and are wiki-linked from the entries that produced and consumed them.

|                                     | Drafted in | Used in |
| ----------------------------------- | ---------- | ------- |
| [[P1]] — initial setup prompt       | A-001      | A-003   |
| [[P2]] — plan review changes        | A-002      | A-003   |
| [[P3]] — repo configuration prompt  | A-004      | A-005   |
| [[P4]] — AI dossier backfill prompt | A-006      | A-007   |

## Reading this vault in Obsidian

Open the **`docs/` folder itself** as an Obsidian vault (_Open folder as vault_) — not a subfolder,
or the wikilinks will not resolve and you will get a second `.obsidian/` directory. The
Templates core plugin is already pointed at `templates`, so <kbd>Ctrl/Cmd+P</kbd> → _Insert template_
gives you the two note shapes.

Nothing here depends on a community plugin. If you do have **Dataview** installed, this query
renders the interaction table automatically:

    ```dataview
    TABLE date, author, tool, mode, area, decision, verification
    FROM "ai-log/interactions"
    SORT id ASC
    ```

Without Dataview that block just shows as code, which is why the plain tables above are the
source of truth.
